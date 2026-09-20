"""Thread-free browser adapter around the same validated Python world engine."""
import json
from urllib.parse import urlsplit, parse_qs
from world import World
from town import TOWN
from population import expand_population
from ai_reasoning import build_reasoning_request, validate_reasoning_response


class BrowserWorld:
    def __init__(self, path):
        self.world = World(path)
        expand_population(self.world)
        self.world.ensure_player()
        self.world.start()
        if self.world._state['clock']['tick'] == 0:
            self.world.advance(8)
        self.world.sync_citizen_movements()
        self.info = {'connected': False, 'model': None, 'base_url': None}
        self.pending = {}
        self.outbox = []
        self.errors = {}
        self.next_citizen = 0

    def snapshot(self):
        result = self.world.browser_snapshot()
        result['llm'] = self.info
        result['ai_available'] = [cid for cid in self.world._state['citizens'] if cid != 'player'] if self.info['connected'] else []
        return result

    def dispatch(self, path, body=None):
        url = urlsplit(path)
        if url.path == '/api/map':
            return TOWN
        if url.path == '/api/bootstrap':
            return {'token': 'private-browser-world', 'state': self.snapshot()}
        if url.path == '/api/state':
            return self.snapshot()
        if url.path == '/api/llm/status':
            return self.info
        if url.path == '/api/conversation':
            cid = parse_qs(url.query).get('citizen', [None])[0]
            return {'messages': self.world.conversation('player', cid), 'pending': self.pending.get(cid, {}).get('request_type') == 'respond_to_conversation', 'error': self.errors.get(cid)}
        if url.path == '/api/input':
            result = self.world.act('player', 'steer', params=body)
        elif url.path == '/api/action':
            name, cid = body['action'], body.get('target')
            if name not in {'talk', 'engage', 'disengage', 'assist', 'report'}:
                raise ValueError('Unsupported player action')
            if name == 'talk' and cid in self.pending:
                if self.pending[cid]['request_type'] == 'respond_to_conversation':
                    raise ValueError('Please wait for this citizen to finish replying.')
                del self.pending[cid]
            result = self.world.act('player', name, cid, body.get('message'))
            if name == 'talk' and self.info['connected']:
                self.errors.pop(cid, None)
                request = build_reasoning_request(self.world._state, cid, 'respond_to_conversation', 'Spoken to by player',
                    {'speaker': {'id': 'player', 'name': 'You'}, 'message': body['message'], 'intent': 'neutral'})
                self.pending[cid] = request
                self.outbox.append(request)
        elif url.path == '/api/time':
            tick = self.world._state['clock']['tick']
            if body.get('action') == 'morning':
                ticks = ((tick // 24) + (1 if tick % 24 >= 8 else 0)) * 24 + 8 - tick
            elif body.get('action') == 'advance':
                ticks = body.get('ticks', 1)
            else:
                raise ValueError('Unsupported time action')
            if type(ticks) is not int or not 0 <= ticks <= 24:
                raise ValueError('Advance between 0 and 24 hours')
            self.world.advance(ticks)
            self.world.sync_citizen_movements()
            result = {'ticks': ticks}
        else:
            raise ValueError('Unknown browser route')
        return {'result': result}

    def configure(self, info):
        self.info = info
        self.pending.clear()
        self.outbox.clear()
        self.errors.clear()

    def complete(self, cid, request_id, response, error=None):
        request = self.pending.get(cid)
        if not request or request['request_id'] != request_id:
            return
        del self.pending[cid]
        conversation = request['request_type'] == 'respond_to_conversation'
        if error:
            if conversation:
                self.errors[cid] = error
            return
        decision = validate_reasoning_response(response, request)
        if not conversation or decision.get('decision') == 'talk':
            if conversation:
                decision['target_id'] = 'player'
            try:
                self.world._ai_gateway.execute_decision(self.world, cid, decision, reply_to='player' if conversation else None)
            except ValueError:
                if conversation:
                    self.errors[cid] = 'You moved out of earshot. Move closer and try again.'
        else:
            self.errors[cid] = 'The model returned no valid reply. Try another message or model.'

    def background(self):
        if not self.info.get('connected') or not self.info.get('autonomous') or len(self.pending) >= 2:
            return
        citizens = [cid for cid in self.world._state['citizens'] if cid != 'player']
        cid = citizens[self.next_citizen % len(citizens)]
        self.next_citizen += 1
        if cid in self.pending:
            return
        request = build_reasoning_request(self.world._state, cid, 'perceive_and_decide', 'Consider your daily routine')
        self.pending[cid] = request
        self.outbox.append(request)

    def drain(self):
        requests, self.outbox = self.outbox, []
        return requests
