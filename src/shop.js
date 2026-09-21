/**
 * shop.js — Shop interaction vertical slice.
 * Presents contextual choices and a "DO SOMETHING ELSE" input.
 */

export class Shop {
  constructor(ai, ui, gameState, audio, videoManager) {
    this.ai = ai;
    this.ui = ui;
    this.gameState = gameState;
    this.audio = audio;
    this.videoManager = videoManager;
  }

  async interact() {
    // Pause world by switching to encounter screen
    const dna = this.gameState.objectDNA || {};

    // Build choices
    const encounter = {
      scene: `You enter a small shop. A customer eyes ${dna.name || 'you'}.`,
      choiceA: { label: 'Hide behind goods', emoji: '🫥' },
      choiceB: { label: 'Let them pick you', emoji: '🛍️' }
    };

    const choice = await this.ui.showEncounter(encounter, this.gameState.chapter, this.gameState.totalChapters, this.gameState.currentState, dna, this.gameState.objectImage);

    if (choice === 'A') {
      // simple deterministic result
      const result = { consequence: `${dna.name} hides and avoids notice.`, stateChanges: { mood: 'Hidden' }, memory: 'Hid in shop' };
      this.gameState.applyConsequence(result);
      await this.ui.showConsequence(result, this.gameState.currentState);
      // Try to generate a tiny clip for hiding scene
      this.videoManager?.generateAndPlay(result.consequence, { dna, result }).catch(() => {});
      return;
    }

    if (choice === 'B') {
      // Offer DO SOMETHING ELSE prompt after simple choice
      const doElse = confirm('Do something else? (OK to open text input)');
      if (doElse) {
        const action = prompt('What do you want to do? (Malayalam/Manglish/English)');
        if (action) {
          // call AI evalAction
          try {
            const res = await this.ai.evalAction({ dna, state: this.gameState.currentState, actionText: action });
            // Expect result: { consequence, stateChanges, memory }
            this.gameState.applyConsequence(res);
            await this.ui.showConsequence(res, this.gameState.currentState);
              // play short resulting clip
              this.videoManager?.generateAndPlay(res.consequence, { dna, res }).catch(() => {});
            return;
          } catch (err) {
            console.error('[SHOP] evalAction failed', err);
            const fallback = { consequence: 'Nothing happened.', stateChanges: {}, memory: 'Attempted action but failed.' };
            this.gameState.applyConsequence(fallback);
            await this.ui.showConsequence(fallback, this.gameState.currentState);
            return;
          }
        }
      }

      // If no free action, simulate sale
      const sale = { consequence: `${dna.name} was picked and sold.`, stateChanges: { money: 30, mood: 'Sold' }, memory: 'Sold at shop' };
      this.gameState.applyConsequence(sale);
      await this.ui.showConsequence(sale, this.gameState.currentState);
      return;
    }
  }
}
