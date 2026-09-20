# Phase 1 — World Foundation

## Purpose

Create a small world that exists and advances without a browser connected.

## Completed

- One street, two homes, one shop, three citizens, and connected paths.
- Stable IDs for locations, paths, citizens, and the shop.
- Start, pause, explicit advance, and headless ticking.
- Detached public snapshots.
- Ordered events and atomic JSON persistence.
- Validation, restoration, concurrent updates, and failed-write recovery.

## Public Interface

```python
world.snapshot()
world.start()
world.pause()
world.advance(ticks)
world.tick_if_running()
```

## Validation

```sh
python3 -m unittest discover -s tests -v
```

## Handoff

All future gameplay mutations must pass through a shared validated action boundary. Callers must not edit JSON or detached snapshots directly.
