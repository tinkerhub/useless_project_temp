/**
 * game-state.js — Persistent in-memory game state.
 *
 * Manages the object's complete lifecycle:
 * - Immutable DNA (identity, personality, abilities)
 * - Mutable state (condition, money, mood, location, owner, etc.)
 * - Encounter history & memories
 * - Death tracking
 *
 * The AI proposes state changes; this module validates and applies them.
 */

export class GameState {
  constructor() {
    this.reset();
  }

  /** Reset to fresh state (new game) */
  reset() {
    this.objectDNA = null;
    this.objectImage = null;    // base64 data URI of captured object
    this.chapter = 0;
    this.totalChapters = 5;     // chapters 1-4 = encounters, 5 = death
    this.isAlive = true;
    this.deathCause = null;
    this.deathData = null;      // full death scene data from AI
    this.lifeScript = null;     // full pre-generated life script

    // Mutable state — persists across encounters
    this.state = {
      condition: 'Unknown',
      money: 0,
      mood: 'Unknown',
      location: 'Unknown',
      owner: null,
      occupation: null,
      reputation: 'None',
      wantedStatus: false,
    };

    // Accumulated biography
    this.memories = [];
    this.relationships = [];
    this.encounterHistory = [];   // full encounter data for eulogy
    this.specialAbilityUsesRemaining = 0;
  }

  /**
   * Initialize state from birth (DNA generation result).
   * @param {Object} dna - The generated Object DNA
   * @param {string} image - Base64 data URI of the captured object image
   */
  initFromBirth(dna, image) {
    this.objectDNA = dna;
    this.objectImage = image;
    this.chapter = 1;
    this.isAlive = true;
    this.deathCause = null;
    this.deathData = null;
    this.lifeScript = null;

    // Seed mutable state from passport DNA
    this.state = {
      condition: 'Fresh',
      money: Math.floor(Math.random() * 46) + 5, // 5-50
      mood: dna.mood || 'Confused',
      location: 'Airport',
      owner: null,
      occupation: null,
      reputation: 'New Arrival',
      wantedStatus: false,
    };

    this.memories = [];
    this.relationships = [];
    this.encounterHistory = [];
    this.specialAbilityUsesRemaining = 2;

    console.log('[GAME STATE] Initialized from birth:', dna.name);
  }

  /**
   * Returns a compact context object for sending to the AI Game Master.
   * This is what the AI sees when generating encounters.
   */
  toAIContext() {
    return {
      objectDNA: this.objectDNA,
      chapter: this.chapter,
      totalChapters: this.totalChapters,
      currentState: { ...this.state },
      specialAbilityUsesRemaining: this.specialAbilityUsesRemaining,
      memories: this.memories.slice(-6),          // last 6 memories for context
      relationships: this.relationships,
      lastEncounter: this.encounterHistory[this.encounterHistory.length - 1] || null,
      isAlive: this.isAlive,
      isFinalChapter: this.isFinalChapter,
    };
  }

  /** Store the pre-generated life script from AI */
  setLifeScript(script) {
    this.lifeScript = script;
  }

  /**
   * Returns the full biography for the death/eulogy screen.
   */
  toEulogyContext() {
    return {
      objectDNA: this.objectDNA,
      objectImage: this.objectImage,
      totalChapters: this.encounterHistory.length,
      allMemories: [...this.memories],
      allRelationships: [...this.relationships],
      allEncounters: this.encounterHistory.map(e => ({
        chapter: e.chapter,
        scene: e.scene,
        choiceMade: e.choiceMade,
        consequence: e.consequence,
      })),
      finalState: { ...this.state },
      deathCause: this.deathCause,
      deathData: this.deathData,
    };
  }

  /**
   * Apply state changes from a resolved encounter.
   * Validates and clamps values.
   * @param {Object} changes - Key-value pairs to merge into state
   */
  applyStateChanges(changes) {
    if (!changes || typeof changes !== 'object') return;

    for (const [key, value] of Object.entries(changes)) {
      if (key === 'money') {
        this.state.money = Math.max(-50, Math.min(999, this.state.money + Number(value) || 0));
      } else if (key === 'wantedStatus') {
        this.state.wantedStatus = !!value;
      } else {
        // Allow any string state field (condition, mood, location, owner, etc.)
        if (typeof value === 'string' && value.length <= 60) {
          this.state[key] = value;
        } else if (typeof value === 'number') {
          this.state[key] = value;
        }
      }
    }
  }

  /** Add a memory from an encounter */
  addMemory(memory) {
    if (memory && typeof memory === 'string') {
      this.memories.push(memory.substring(0, 120)); // cap length
    }
  }

  /** Add or update a relationship */
  addRelationship(name, status) {
    if (!name) return;
    const existing = this.relationships.find(r => r.name === name);
    if (existing) {
      existing.status = status;
    } else {
      if (this.relationships.length < 10) { // cap at 10 relationships
        this.relationships.push({ name, status });
      }
    }
  }

  /**
   * Record a completed encounter with full data.
   * @param {Object} encounterData - { scene, choiceA, choiceB, choiceMade, consequence }
   */
  recordEncounter(encounterData) {
    this.encounterHistory.push({
      chapter: this.chapter,
      ...encounterData,
      timestamp: Date.now(),
    });
    this.chapter++;
  }

  /** Mark the object as dead */
  die(cause, fullDeathData = null) {
    this.isAlive = false;
    this.deathCause = cause || 'Unknown causes';
    this.deathData = fullDeathData;
    this.state.condition = 'Dead';
    console.log(`[GAME STATE] ${this.objectDNA?.name || 'Object'} has died: ${cause}`);
  }

  /** Check if we've reached the final chapter */
  get isFinalChapter() {
    return this.chapter >= this.totalChapters;
  }

  /**
   * Advance to the next chapter (called by main.js life loop).
   */
  advanceChapter() {
    this.chapter++;
    console.log(`[GAME STATE] Advanced to chapter ${this.chapter}`);
  }

  /**
   * Apply consequence result from AI resolve endpoint.
   * Wraps applyStateChanges + memory + relationship recording.
   * @param {Object} result - { consequence, stateChanges, memory, newRelationship? }
   */
  applyConsequence(result) {
    if (!result) return;
    if (result.stateChanges) this.applyStateChanges(result.stateChanges);
    if (result.memory) this.addMemory(result.memory);
    if (result.newRelationship) {
      this.addRelationship(result.newRelationship.name, result.newRelationship.status);
    }
    // Record in encounter history
    this.encounterHistory.push({
      chapter: this.chapter,
      consequence: result.consequence,
      memory: result.memory,
      timestamp: Date.now(),
    });
  }

  /**
   * Record the object's death (alias for die(), called by main.js).
   * @param {string} cause - Cause of death
   */
  recordDeath(cause) {
    this.die(cause);
  }

  /** Alias for currentState used by main.js */
  get currentState() {
    return this.state;
  }
}
