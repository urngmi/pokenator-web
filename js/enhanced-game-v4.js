// Enhanced Pokénator with CLI V3.1 Features
class SimplePokenatorGame {
    constructor() {
        this.pokemonData = null;
        this.traitMatrix = null;
        this.gameActive = false;
        this.questionsAsked = 0;
        this.maxQuestions = 25;
        this.askedTraits = new Set();
        this.answers = new Map(); // trait -> confidence
        
        // Anti-spam question tracking (CLI V3.1 feature)
        this.typeQuestionsAsked = 0;
        this.habitatQuestionsAsked = 0;
        this.colorQuestionsAsked = 0;
        this.statQuestionsAsked = 0;
        this.physicalQuestionsAsked = 0;
        
        // STRICT LIMITS (from CLI)
        this.MAX_TYPE_QUESTIONS = 3;
        this.MAX_HABITAT_QUESTIONS = 2;
        this.MAX_COLOR_QUESTIONS = 2;
        this.MAX_STAT_QUESTIONS = 4;
        this.MAX_PHYSICAL_QUESTIONS = 3;
        
        // Advanced calibration parameters (CLI V3.1)
        this.calibrationFactor = 0.95;
        this.uncertaintyBoost = 0.25;
        this.humanErrorTolerance = 0.3;
        this.entropyThreshold = 0.1;
        
        // Performance optimization settings
        this.lookaheadDepth = 2;
        this.tieBreakingThreshold = 0.003;
        
        // Session tracking and statistics (CLI V3.1 feature)
        this.sessionStats = {
            questionsAsked: 0,
            typeQuestions: 0,
            habitatQuestions: 0,
            colorQuestions: 0,
            statQuestions: 0,
            physicalQuestions: 0,
            averageInformationGain: 0,
            totalInformationGain: 0,
            engineVersion: '4.0-CLI-Enhanced',
            sessionStartTime: null
        };
        
        this.initializeUI();
        this.loadData();
    }
    
    async loadData() {
        try {
            console.log('Loading data...');
            const [pokemonArray, traitMatrix] = await Promise.all([
                fetch('js/pokemon.json').then(r => r.json()),
                fetch('js/trait-matrix.json').then(r => r.json())
            ]);
            
            // Convert array to object for Pokemon data
            this.pokemonData = {};
            pokemonArray.forEach(p => this.pokemonData[p.name] = p);
            
            // Convert trait matrix from array format to object format for easier access
            this.traitMatrix = {};
            const pokemonNames = traitMatrix.pokemon_names;
            
            for (const [trait, valuesArray] of Object.entries(traitMatrix.traits)) {
                this.traitMatrix[trait] = {};
                pokemonNames.forEach((pokemonName, index) => {
                    this.traitMatrix[trait][pokemonName] = valuesArray[index];
                });
            }
            
            console.log(`Loaded ${Object.keys(this.pokemonData).length} Pokemon`);
            console.log(`Loaded ${Object.keys(this.traitMatrix).length} traits`);
            this.enableStartButton();
            
        } catch (error) {
            console.error('Failed to load data:', error);
            alert('Failed to load game data');
        }
    }
    
    initializeUI() {
        this.elements = {
            startButton: document.getElementById('start-game'),
            questionText: document.getElementById('question-text'),
            questionNum: document.getElementById('current-question-num'),
            progressFill: document.getElementById('progress-fill')
        };
        
        this.screens = {
            welcome: document.getElementById('welcome-screen'),
            question: document.getElementById('question-screen'),
            thinking: document.getElementById('thinking-screen'),
            results: document.getElementById('results-screen')
        };
        
        // Keyboard navigation state
        this.selectedAnswerIndex = 0;
        this.answerButtons = [];
        
        // Disable start button initially
        if (this.elements.startButton) {
            this.elements.startButton.disabled = true;
            this.elements.startButton.querySelector('span').textContent = 'Loading...';
            this.elements.startButton.addEventListener('click', () => this.startGame());
        }
        
        // Answer buttons
        document.querySelectorAll('.answer-button').forEach(button => {
            button.addEventListener('click', () => {
                const confidence = parseFloat(button.getAttribute('data-confidence'));
                this.answerQuestion(confidence);
            });
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardInput(e));
        
        // Result buttons
        const playAgainBtn = document.getElementById('play-again');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.startGame());
        }
        
        const correctBtn = document.getElementById('correct-guess');
        if (correctBtn) {
            correctBtn.addEventListener('click', () => this.showScreen('welcome'));
        }
        
        const wrongBtn = document.getElementById('wrong-guess');
        if (wrongBtn) {
            wrongBtn.addEventListener('click', () => this.showScreen('welcome'));
        }
    }
    
    enableStartButton() {
        if (this.elements.startButton) {
            this.elements.startButton.disabled = false;
            this.elements.startButton.querySelector('span').textContent = 'Start Game';
        }
    }
    
    startGame() {
        console.log('🚀 Starting enhanced game with CLI V3.1 features...');
        
        // Check if data is loaded
        if (!this.pokemonData || !this.traitMatrix) {
            console.error('❌ Data not loaded yet!');
            alert('Please wait for data to load before starting the game.');
            return;
        }
        
        console.log(`✅ Data loaded: ${Object.keys(this.pokemonData).length} Pokemon`);
        
        this.gameActive = true;
        this.questionsAsked = 0;
        this.askedTraits.clear();
        this.answers.clear();
        
        // Reset anti-spam counters
        this.typeQuestionsAsked = 0;
        this.habitatQuestionsAsked = 0;
        this.colorQuestionsAsked = 0;
        this.statQuestionsAsked = 0;
        this.physicalQuestionsAsked = 0;
        
        // Initialize session statistics
        this.sessionStats = {
            questionsAsked: 0,
            typeQuestions: 0,
            habitatQuestions: 0,
            colorQuestions: 0,
            statQuestions: 0,
            physicalQuestions: 0,
            averageInformationGain: 0,
            totalInformationGain: 0,
            engineVersion: '4.0-CLI-Enhanced',
            sessionStartTime: new Date()
        };
        
        console.log('⚡ Features enabled: Entropy-based selection, Tie-breaking, Calibration, Anti-spam');
        
        this.nextQuestion();
    }
    
    nextQuestion() {
        if (this.questionsAsked >= this.maxQuestions) {
            this.makeGuess();
            return;
        }
        
        // Enhanced question selection with anti-spam logic
        const selectedTrait = this.selectBestQuestion();
        
        if (!selectedTrait) {
            this.makeGuess();
            return;
        }
        
        this.currentTrait = selectedTrait;
        this.askedTraits.add(selectedTrait);
        this.questionsAsked++;
        
        // Track question type for anti-spam
        this.trackQuestionType(selectedTrait);
        
        const question = this.getQuestionText(selectedTrait);
        this.showQuestion(question);
    }
    
    selectBestQuestion() {
        console.log('🔍 Selecting best question...');
        
        // Get current candidates based on answers
        const candidates = this.getCurrentCandidates();
        console.log(`📊 Current candidates: ${candidates.length}`);
        
        if (candidates.length <= 1) {
            console.log('❌ Too few candidates, making guess');
            return null; // Ready to guess
        }
        
        // All possible traits with priorities (from CLI)
        const allTraits = this.getAllTraitsWithPriorities();
        console.log(`🎯 Total available traits: ${Object.keys(allTraits).length}`);
        
        // Score each trait
        let bestTrait = null;
        let bestScore = -1;
        let validTraits = 0;
        
        for (const trait of Object.keys(allTraits)) {
            if (this.askedTraits.has(trait)) continue;
            
            // Check if trait exists in trait matrix
            if (!this.traitMatrix[trait]) {
                console.log(`⚠️ Trait ${trait} not found in trait matrix`);
                continue;
            }
            
            validTraits++;
            
            // Check anti-spam limits
            if (this.isQuestionTypeMaxedOut(trait)) {
                console.log(`❌ Skipping ${trait} - type limit reached`);
                continue;
            }
            
            // Calculate information gain
            const infoGain = this.calculateInformationGain(trait, candidates);
            
            // Get diversity score (anti-spam priority)
            const diversityScore = this.getDiversityScore(trait);
            
            // Combined score
            const finalScore = infoGain * diversityScore;
            
            if (finalScore > bestScore) {
                bestScore = finalScore;
                bestTrait = trait;
            }
        }
        
        console.log(`✅ Valid traits found: ${validTraits}`);
        console.log(`🏆 Best trait selected: ${bestTrait} (score: ${bestScore})`);
        
        // Track session statistics
        if (bestTrait) {
            const infoGain = this.calculateInformationGain(bestTrait, candidates);
            this.sessionStats.totalInformationGain += infoGain;
            this.sessionStats.questionsAsked++;
            this.sessionStats.averageInformationGain = 
                this.sessionStats.totalInformationGain / this.sessionStats.questionsAsked;
        }
        
        console.log(`✨ Selected: ${bestTrait} (score: ${bestScore.toFixed(3)}, candidates: ${candidates.length})`);
        return bestTrait;
    }
    
    getAllTraitsWithPriorities() {
        // Optimal trait subset from CLI V3.1 mathematical analysis
        // Only the most human-recognizable and mathematically effective traits
        return {
            // ESSENTIAL VARIETY (ask these first - humans always know)
            'starter_pokemon': 10.0,
            'final_evolution': 9.5,
            'is_legendary': 9.0,
            'is_mythical': 8.5,
            'iconic_pokemon': 8.0,
            
            // TYPE DIVERSITY (primary discriminators)
            'type_fire': 7.5,
            'type_water': 7.5,
            'type_grass': 7.5,
            'type_electric': 7.0,
            'type_psychic': 7.0,
            'type_dragon': 6.8,
            'type_flying': 6.5,
            'type_fighting': 6.3,
            'type_poison': 6.0,
            'type_ground': 5.8,
            'type_rock': 5.5,
            'type_bug': 5.3,
            'type_ghost': 6.5,
            'type_steel': 5.0,
            'type_ice': 5.2,
            'type_dark': 5.8,
            'type_fairy': 6.0,
            'type_normal': 4.5,
            
            // PHYSICAL CHARACTERISTICS (humans notice these)
            'size_large': 4.8,
            'size_small': 4.7,
            'size_medium': 4.0,
            'weight_heavy': 4.5,
            'weight_light': 4.3,
            
            // COLOR TRAITS (visual recognition)
            'color_red': 4.2,
            'color_blue': 4.2,
            'color_yellow': 4.2,
            'color_green': 4.0,
            'color_purple': 3.8,
            'color_orange': 3.7,
            'color_pink': 3.5,
            'color_brown': 3.2,
            'color_black': 3.8,
            'color_white': 3.6,
            'color_gray': 3.0,
            
            // HABITAT INFORMATION (story context)
            'habitat_cave': 3.5,
            'habitat_forest': 3.4,
            'habitat_water': 3.6,
            'habitat_mountain': 3.2,
            'habitat_grassland': 3.0,
            'habitat_urban': 3.1,
            'habitat_desert': 2.8,
            'habitat_sea': 3.3,
            
            // STAT EXTREMES (for experienced players)
            'high_attack': 2.8,
            'high_defense': 2.7,
            'high_hp': 2.6,
            'high_speed': 2.9,
            'high_sp_attack': 2.5,
            'high_sp_defense': 2.4,
            'low_attack': 2.2,
            'low_defense': 2.2,
            'low_hp': 2.1,
            'low_speed': 2.3,
            
            // EVOLUTION CONTEXT (recognizable patterns)
            'evolves_from_baby': 3.3,
            'has_evolution': 3.2,
            'three_stage_evolution': 3.0,
            'branch_evolution': 2.8,
            
            // GAME MECHANICS (for enthusiasts)
            'can_mega_evolve': 2.5,
            'has_alolan_form': 2.3,
            'has_galarian_form': 2.2,
            'trade_evolution': 2.0,
            'stone_evolution': 2.1,
            'level_evolution': 1.8,
            
            // SPECIAL ATTRIBUTES (distinctive features)
            'dual_type': 2.7,
            'single_type': 2.5,
            'genderless': 2.4,
            'always_male': 2.2,
            'always_female': 2.2,
            
            // COMPETITIVE CONTEXT (advanced knowledge)
            'uber_tier': 1.9,
            'ou_tier': 1.7,
            'uu_tier': 1.5,
            'ru_tier': 1.3,
            'nu_tier': 1.2,
            'pu_tier': 1.1
        };
    }
    
    getQuestionType(trait) {
        if (trait.startsWith('type_')) return 'type';
        if (trait.startsWith('habitat_')) return 'habitat';
        if (trait.startsWith('color_')) return 'color';
        if (trait.startsWith('high_')) return 'stat';
        if (trait.startsWith('size_') || trait.startsWith('weight_')) return 'physical';
        return 'other';
    }
    
    isQuestionTypeMaxedOut(trait) {
        const type = this.getQuestionType(trait);
        switch (type) {
            case 'type': return this.typeQuestionsAsked >= this.MAX_TYPE_QUESTIONS;
            case 'habitat': return this.habitatQuestionsAsked >= this.MAX_HABITAT_QUESTIONS;
            case 'color': return this.colorQuestionsAsked >= this.MAX_COLOR_QUESTIONS;
            case 'stat': return this.statQuestionsAsked >= this.MAX_STAT_QUESTIONS;
            case 'physical': return this.physicalQuestionsAsked >= this.MAX_PHYSICAL_QUESTIONS;
            default: return false;
        }
    }
    
    trackQuestionType(trait) {
        const type = this.getQuestionType(trait);
        switch (type) {
            case 'type': this.typeQuestionsAsked++; break;
            case 'habitat': this.habitatQuestionsAsked++; break;
            case 'color': this.colorQuestionsAsked++; break;
            case 'stat': this.statQuestionsAsked++; break;
            case 'physical': this.physicalQuestionsAsked++; break;
        }
    }
    
    getDiversityScore(trait) {
        // Ultra-sophisticated diversity scoring from CLI V3.1
        const type = this.getQuestionType(trait);
        const priorities = this.getAllTraitsWithPriorities();
        
        // Base priority score
        let score = priorities[trait] || 1.0;
        
        // HARD BLOCK for maxed out question types
        if (this.isQuestionTypeMaxedOut(trait)) {
            return 0.001; // Effectively zero but not completely blocked
        }
        
        // Apply progressive diversity penalties (mathematical optimization)
        let currentCount = 0;
        let maxCount = 999;
        
        switch (type) {
            case 'type': 
                currentCount = this.typeQuestionsAsked; 
                maxCount = this.MAX_TYPE_QUESTIONS;
                break;
            case 'habitat': 
                currentCount = this.habitatQuestionsAsked; 
                maxCount = this.MAX_HABITAT_QUESTIONS;
                break;
            case 'color': 
                currentCount = this.colorQuestionsAsked; 
                maxCount = this.MAX_COLOR_QUESTIONS;
                break;
            case 'stat': 
                currentCount = this.statQuestionsAsked; 
                maxCount = this.MAX_STAT_QUESTIONS;
                break;
            case 'physical': 
                currentCount = this.physicalQuestionsAsked; 
                maxCount = this.MAX_PHYSICAL_QUESTIONS;
                break;
        }
        
        // Advanced penalty function (exponential decay)
        if (currentCount > 0 && maxCount < 999) {
            const ratio = currentCount / maxCount;
            
            // Exponential penalty that gets severe near the limit
            const basePenalty = Math.exp(-3 * ratio); // e^(-3*ratio)
            
            // Additional mathematical penalty for diversity
            const diversityPenalty = Math.pow(0.2, ratio * 4);
            
            score *= Math.min(basePenalty, diversityPenalty);
        }
        
        // Bonus for essential early questions
        if (this.questionsAsked < 5 && score >= 8.0) {
            score *= 1.3; // 30% bonus for critical early questions
        }
        
        // Progressive game stage modifiers
        const gameProgress = this.questionsAsked / this.maxQuestions;
        
        if (gameProgress < 0.3) {
            // Early game: prefer broad categorization
            if (type === 'type' || trait.includes('legendary') || trait.includes('starter')) {
                score *= 1.25;
            }
        } else if (gameProgress > 0.7) {
            // Late game: prefer precise discrimination
            if (type === 'stat' || type === 'physical') {
                score *= 1.15;
            }
        }
        
        return score;
    }
    
    showQuestion(question) {
        console.log(`Question ${this.questionsAsked}: ${question}`);
        
        if (this.elements.questionText) {
            this.elements.questionText.textContent = question;
        }
        
        if (this.elements.questionNum) {
            this.elements.questionNum.textContent = this.questionsAsked;
        }
        
        if (this.elements.progressFill) {
            const progress = (this.questionsAsked / this.maxQuestions) * 100;
            this.elements.progressFill.style.width = `${progress}%`;
        }
        
        this.showScreen('question');
        
        // Initialize keyboard navigation for answer buttons
        this.initializeAnswerSelection();
    }
    
    answerQuestion(confidence) {
        if (!this.gameActive || !this.currentTrait) return;
        
        console.log(`Answered: ${this.currentTrait} = ${confidence}`);
        this.answers.set(this.currentTrait, confidence);
        
        this.showScreen('thinking');
        
        // Short delay then next question
        setTimeout(() => {
            this.nextQuestion();
        }, 1000);
    }
    
    makeGuess() {
        console.log('🎯 Making guess with entropy-based tie-breaking...');
        this.gameActive = false;
        
        // Show final session statistics
        this.logSessionStatistics();
        
        // Debug candidate analysis
        this.debugCandidateAnalysis();
        
        // Calculate confidence scores for all Pokemon with advanced calibration
        const candidateScores = [];
        
        for (const [pokemonName, pokemon] of Object.entries(this.pokemonData)) {
            const confidence = this.calculateAdvancedPokemonConfidence(pokemonName);
            candidateScores.push({ pokemon: pokemonName, confidence });
        }
        
        // Sort by confidence
        candidateScores.sort((a, b) => b.confidence - a.confidence);
        
        // Apply entropy-based tie-breaking for close scores
        const bestCandidates = this.resolveCloseTies(candidateScores);
        
        const bestGuess = bestCandidates[0];
        console.log(`🏆 Final guess: ${bestGuess.pokemon} (confidence: ${(bestGuess.confidence * 100).toFixed(1)}%)`);
        
        this.showGuess(bestGuess.pokemon, bestGuess.confidence);
    }
    
    calculateAdvancedPokemonConfidence(pokemonName) {
        if (this.answers.size === 0) return 0.1;
        
        let totalScore = 0;
        let totalWeight = 0;
        
        // Enhanced confidence calculation with trait weighting
        for (const [trait, userConfidence] of this.answers) {
            const pokemonHasTrait = this.traitMatrix[trait]?.[pokemonName] || false;
            const traitWeight = this.getTraitWeight(trait);
            
            // Fuzzy matching with human error tolerance
            let traitScore;
            if (pokemonHasTrait) {
                // Pokemon has trait - score based on user confidence
                traitScore = userConfidence;
            } else {
                // Pokemon doesn't have trait - inverse of user confidence
                traitScore = 1 - userConfidence;
            }
            
            // Apply uncertainty boost for middle-ground answers
            if (userConfidence >= 0.4 && userConfidence <= 0.6) {
                traitScore *= 1.25; // Boost uncertain responses
            }
            
            totalScore += traitScore * traitWeight;
            totalWeight += traitWeight;
        }
        
        if (totalWeight === 0) return 0.1;
        
        const baseConfidence = totalScore / totalWeight;
        
        // Apply final calibration (less aggressive than CLI for web users)
        const calibrated = 0.15 + 0.7 * baseConfidence; // Map [0,1] to [0.15, 0.85]
        
        // Add small random noise to break perfect ties
        const noise = (Math.random() - 0.5) * 0.002;
        
        return Math.max(0.05, Math.min(0.95, calibrated + noise));
    }
    
    getTraitWeight(trait) {
        // Enhanced trait weights from CLI analysis
        const weights = {
            // Essential traits (humans always know these)
            'starter_pokemon': 2.5,
            'is_legendary': 2.0,
            'is_mythical': 2.0,
            'final_evolution': 1.8,
            
            // Type traits (very reliable)
            'type_fire': 1.5, 'type_water': 1.5, 'type_grass': 1.5,
            'type_electric': 1.5, 'type_psychic': 1.5, 'type_dragon': 1.5,
            'type_flying': 1.3, 'type_fighting': 1.3, 'type_poison': 1.3,
            
            // Physical traits (observable)
            'size_large': 1.2, 'size_small': 1.2,
            'color_red': 1.1, 'color_blue': 1.1, 'color_yellow': 1.1,
            
            // Habitat (somewhat reliable)
            'habitat_cave': 1.0, 'habitat_forest': 1.0, 'habitat_water': 1.0,
            
            // Stats (less reliable for casual players)
            'high_attack': 0.8, 'high_defense': 0.8, 'high_speed': 0.8
        };
        
        return weights[trait] || 1.0;
    }
    
    resolveCloseTies(candidates) {
        if (candidates.length < 2) return candidates;
        
        const resolved = [];
        let i = 0;
        
        while (i < candidates.length) {
            // Find candidates with very similar confidence (within 0.003)
            const tiedGroup = [candidates[i]];
            let j = i + 1;
            
            while (j < candidates.length && 
                   Math.abs(candidates[j].confidence - candidates[i].confidence) < 0.003) {
                tiedGroup.push(candidates[j]);
                j++;
            }
            
            if (tiedGroup.length > 1) {
                // Resolve tie using popularity and distinctiveness
                const winner = this.resolveTieWithEntropy(tiedGroup);
                resolved.push(winner);
                
                // Add others in original order
                for (const candidate of tiedGroup) {
                    if (candidate.pokemon !== winner.pokemon) {
                        resolved.push(candidate);
                    }
                }
            } else {
                resolved.push(tiedGroup[0]);
            }
            
            i = j;
        }
        
        return resolved;
    }
    
    resolveTieWithEntropy(tiedCandidates) {
        // Simple entropy-based tie-breaking
        let bestScore = -1;
        let winner = tiedCandidates[0];
        
        for (const candidate of tiedCandidates) {
            const pokemon = this.pokemonData[candidate.pokemon];
            let distinctiveness = 0;
            
            // Popularity boost for iconic Pokemon
            if (this.isIconicPokemon(candidate.pokemon)) {
                distinctiveness += 0.3;
            }
            
            // Type rarity bonus
            const types = pokemon.types || [];
            for (const type of types) {
                if (['dragon', 'ghost', 'psychic', 'electric'].includes(type)) {
                    distinctiveness += 0.2;
                }
            }
            
            // Stat extremes (distinctive characteristics)
            const stats = pokemon.stats || {};
            const statValues = Object.values(stats);
            if (statValues.length > 0) {
                const maxStat = Math.max(...statValues);
                const minStat = Math.min(...statValues);
                
                if (maxStat > 120) distinctiveness += 0.25;
                if (minStat < 30) distinctiveness += 0.15;
            }
            
            if (distinctiveness > bestScore) {
                bestScore = distinctiveness;
                winner = candidate;
            }
        }
        
        return winner;
    }
    
    isIconicPokemon(pokemonName) {
        const iconic = [
            'pikachu', 'charizard', 'blastoise', 'venusaur', 'mewtwo', 'mew',
            'lugia', 'ho-oh', 'rayquaza', 'arceus', 'dialga', 'palkia',
            'giratina', 'reshiram', 'zekrom', 'kyurem', 'xerneas', 'yveltal'
        ];
        return iconic.includes(pokemonName.toLowerCase());
    }
    
    async showGuess(pokemon, confidence) {
        // Update the basic info
        const pokemonNameEl = document.getElementById('guessed-pokemon');
        const confidenceEl = document.getElementById('final-confidence');
        
        if (pokemonNameEl) {
            pokemonNameEl.textContent = pokemon;
        }
        
        if (confidenceEl) {
            confidenceEl.textContent = `${(confidence * 100).toFixed(1)}%`;
        }
        
        // Show the results screen
        this.showScreen('results');
        
        // Initialize the classic Pokemon reveal animation
        await this.startPokemonRevealAnimation(pokemon);
    }
    
    async startPokemonRevealAnimation(pokemonName) {
        // Get Pokemon ID for API call
        const pokemonId = this.getPokemonId(pokemonName);
        
        // Get sprite URLs
        const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
        
        // Show silhouette stage
        const silhouetteStage = document.getElementById('silhouette-stage');
        const revealStage = document.getElementById('reveal-stage');
        const resultActions = document.getElementById('result-actions');
        
        // Hide reveal stage and actions initially
        revealStage.style.display = 'none';
        resultActions.style.display = 'none';
        silhouetteStage.style.display = 'block';
        
        // Load the sprite for silhouette
        const silhouetteImg = document.getElementById('pokemon-silhouette');
        silhouetteImg.src = spriteUrl;
        
        // Auto-reveal after brief suspense (1 second)
        setTimeout(() => {
            this.revealPokemon(pokemonName, spriteUrl);
        }, 1000);
    }
    
    async revealPokemon(pokemonName, spriteUrl) {
        const silhouetteStage = document.getElementById('silhouette-stage');
        const revealStage = document.getElementById('reveal-stage');
        const resultActions = document.getElementById('result-actions');
        const flashEffect = revealStage.querySelector('.flash-effect');
        const pokemonSprite = document.getElementById('pokemon-sprite');
        
        // Hide silhouette stage
        silhouetteStage.style.display = 'none';
        
        // Show reveal stage
        revealStage.style.display = 'block';
        
        // Load the sprite
        pokemonSprite.src = spriteUrl;
        
        // Start flash effect immediately
        flashEffect.classList.add('active');
        
        // Play reveal sound effect
        this.playRevealSound();
        
        // Remove flash effect after animation
        setTimeout(() => {
            flashEffect.classList.remove('active');
        }, 600);
        
        // Show result actions very quickly (total time: 1.5 seconds)
        setTimeout(() => {
            resultActions.style.display = 'block';
        }, 1500);
    }
    
    getPokemonId(pokemonName) {
        // Convert Pokemon name to ID for API
        const pokemon = this.pokemonData[pokemonName];
        if (pokemon && pokemon.id) {
            return pokemon.id;
        }
        
        // Fallback: try to extract ID from common Pokemon names
        const nameToId = {
            'pikachu': 25,
            'charizard': 6,
            'blastoise': 9,
            'venusaur': 3,
            'mewtwo': 150,
            'mew': 151,
            'alakazam': 65,
            'gengar': 94,
            'dragonite': 149,
            'gyarados': 130
        };
        
        const id = nameToId[pokemonName.toLowerCase()];
        return id || 1; // Default to Bulbasaur if not found
    }
    
    playRevealSound() {
        // Create a simple audio context for a reveal sound effect
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Create a "ta-da" sound effect
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // Audio not supported, silent fail
            console.log('Audio not supported');
        }
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.style.display = 'none';
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].style.display = 'block';
        }
    }
    
    getCurrentCandidates() {
        // Advanced candidate filtering with fuzzy logic from CLI V3.1
        const candidates = [];
        
        if (this.answers.size === 0) {
            // No answers yet - return all Pokemon as viable candidates
            for (const pokemonName of Object.keys(this.pokemonData)) {
                candidates.push({ pokemon: pokemonName, confidence: 0.5 });
            }
            return candidates;
        }
        
        // Calculate game progress once
        const gameProgress = this.questionsAsked / this.maxQuestions;
        
        for (const [pokemonName, pokemon] of Object.entries(this.pokemonData)) {
            const confidence = this.calculateAdvancedPokemonConfidence(pokemonName);
            
            // Only include candidates with reasonable confidence
            // (Dynamic threshold based on game progress)
            const minThreshold = Math.max(0.1, 0.4 - gameProgress * 0.3);
            
            if (confidence >= minThreshold) {
                candidates.push({ pokemon: pokemonName, confidence });
            }
        }
        
        // Sort by confidence (highest first)
        candidates.sort((a, b) => b.confidence - a.confidence);
        
        // Adaptive candidate limit (more selective as game progresses)
        const maxCandidates = Math.max(5, Math.floor(50 - gameProgress * 30));
        
        return candidates.slice(0, maxCandidates);
    }
    
    calculateInformationGain(trait, candidates) {
        if (candidates.length <= 1) return 0;
        
        // Get confidence scores for current candidates
        const candidateConfidences = candidates.map(candidate => candidate.confidence);
        
        // Current entropy based on confidence distribution
        const currentEntropy = this.calculateEntropy(candidateConfidences);
        
        // Split candidates by trait value with confidence weighting
        const positiveCandidates = [];
        const negativeCandidates = [];
        
        for (const candidate of candidates) {
            const pokemon = candidate.pokemon;
            const confidence = candidate.confidence;
            const hasTraitValue = this.traitMatrix[trait]?.[pokemon] || false;
            
            if (hasTraitValue) {
                positiveCandidates.push(confidence);
            } else {
                negativeCandidates.push(confidence);
            }
        }
        
        if (positiveCandidates.length === 0 || negativeCandidates.length === 0) {
            return 0; // No information gain
        }
        
        // Calculate weighted entropy after split
        const totalWeight = candidateConfidences.reduce((sum, conf) => sum + conf, 0);
        const posWeight = positiveCandidates.reduce((sum, conf) => sum + conf, 0);
        const negWeight = negativeCandidates.reduce((sum, conf) => sum + conf, 0);
        
        const posEntropy = this.calculateEntropy(positiveCandidates);
        const negEntropy = this.calculateEntropy(negativeCandidates);
        
        const weightedEntropy = (posWeight / totalWeight) * posEntropy + 
                              (negWeight / totalWeight) * negEntropy;
        
        // Information gain = reduction in entropy
        return Math.max(0, currentEntropy - weightedEntropy);
    }
    
    calculateEntropy(confidences) {
        if (confidences.length === 0) return 0;
        
        // Normalize confidences to create probability distribution
        const total = confidences.reduce((sum, conf) => sum + conf, 0);
        if (total === 0) return 0;
        
        const probabilities = confidences.map(conf => conf / total);
        
        // Calculate Shannon entropy
        let entropy = 0;
        for (const p of probabilities) {
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        }
        
        return entropy;
    }
    
    getQuestionText(trait) {
        // Comprehensive question mapping from CLI
        const questions = {
            // Type questions  
            'type_fire': 'Is it a Fire-type Pokémon? 🔥',
            'type_water': 'Is it a Water-type Pokémon? 💧',
            'type_grass': 'Is it a Grass-type Pokémon? 🌿',
            'type_electric': 'Is it an Electric-type Pokémon? ⚡',
            'type_psychic': 'Is it a Psychic-type Pokémon? 🔮',
            'type_dragon': 'Is it a Dragon-type Pokémon? 🐲',
            'type_flying': 'Is it a Flying-type Pokémon? 🦅',
            'type_fighting': 'Is it a Fighting-type Pokémon? 👊',
            'type_poison': 'Is it a Poison-type Pokémon? ☠️',
            'type_ground': 'Is it a Ground-type Pokémon? 🌍',
            'type_rock': 'Is it a Rock-type Pokémon? 🗿',
            'type_bug': 'Is it a Bug-type Pokémon? 🐛',
            'type_ghost': 'Is it a Ghost-type Pokémon? 👻',
            'type_ice': 'Is it an Ice-type Pokémon? ❄️',
            'type_normal': 'Is it a Normal-type Pokémon? 😐',
            
            // Evolution and status
            'final_evolution': 'Is it a final evolution (can\'t evolve further)?',
            'starter_pokemon': 'Is it a starter Pokémon?',
            'is_legendary': 'Is it a legendary Pokémon?',
            'is_mythical': 'Is it a mythical Pokémon?',
            'iconic_pokemon': 'Is it an iconic/famous Pokémon?',
            
            // Stats
            'high_hp': 'Does it have high HP?',
            'high_attack': 'Does it have high Attack?',
            'high_defense': 'Does it have high Defense?',
            'high_special_attack': 'Does it have high Special Attack?',
            'high_special_defense': 'Does it have high Special Defense?',
            'high_speed': 'Does it have high Speed?',
            
            // Size and weight
            'size_large': 'Is it large in size?',
            'size_medium': 'Is it medium in size?',
            'size_small': 'Is it small in size?',
            'weight_heavy': 'Is it heavy?',
            'weight_medium': 'Is it medium weight?',
            'weight_light': 'Is it light?',
            
            // Colors
            'color_red': 'Is it primarily red in color?',
            'color_blue': 'Is it primarily blue in color?',
            'color_green': 'Is it primarily green in color?',
            'color_yellow': 'Is it primarily yellow in color?',
            'color_brown': 'Is it primarily brown in color?',
            'color_purple': 'Is it primarily purple in color?',
            
            // Habitat
            'habitat_grassland': 'Does it live in grasslands?',
            'habitat_forest': 'Does it live in forests?',
            'habitat_mountain': 'Does it live in mountains?',
            'habitat_cave': 'Does it live in caves?',
            'habitat_sea': 'Does it live in the sea?',
            'habitat_urban': 'Does it live in urban areas?'
        };
        
        return questions[trait] || `Does it have the trait: ${trait}?`;
    }
    
    // Advanced debugging and statistics (CLI V3.1 features)
    logSessionStatistics() {
        const sessionDuration = this.sessionStats.sessionStartTime ? 
            ((new Date() - this.sessionStats.sessionStartTime) / 1000).toFixed(1) : 'N/A';
        
        console.log('📊 Enhanced Pokénator Session Statistics:');
        console.log(`Engine Version: ${this.sessionStats.engineVersion}`);
        console.log(`Session Duration: ${sessionDuration}s`);
        console.log(`Questions Asked: ${this.sessionStats.questionsAsked}`);
        console.log(`Question Diversity:`);
        console.log(`  - Type: ${this.typeQuestionsAsked}/${this.MAX_TYPE_QUESTIONS}`);
        console.log(`  - Habitat: ${this.habitatQuestionsAsked}/${this.MAX_HABITAT_QUESTIONS}`);
        console.log(`  - Color: ${this.colorQuestionsAsked}/${this.MAX_COLOR_QUESTIONS}`);
        console.log(`  - Stat: ${this.statQuestionsAsked}/${this.MAX_STAT_QUESTIONS}`);
        console.log(`  - Physical: ${this.physicalQuestionsAsked}/${this.MAX_PHYSICAL_QUESTIONS}`);
        console.log(`Average Information Gain: ${this.sessionStats.averageInformationGain.toFixed(4)}`);
        console.log(`Total Information Gain: ${this.sessionStats.totalInformationGain.toFixed(4)}`);
    }
    
    debugCandidateAnalysis() {
        const candidates = this.getCurrentCandidates();
        console.log(`🔍 Candidate Analysis (Top 10):`);
        
        candidates.slice(0, 10).forEach((candidate, index) => {
            const pokemon = this.pokemonData[candidate.pokemon];
            const types = pokemon?.types?.join('/') || 'Unknown';
            console.log(`${index + 1}. ${candidate.pokemon} (${types}) - ${(candidate.confidence * 100).toFixed(1)}%`);
        });
        
        return candidates;
    }
    
    debugTraitPriorities() {
        const allTraits = this.getAllTraitsWithPriorities();
        const availableTraits = Object.keys(allTraits)
            .filter(trait => !this.askedTraits.has(trait))
            .sort((a, b) => allTraits[b] - allTraits[a])
            .slice(0, 15);
        
        console.log('🎯 Top Available Traits:');
        availableTraits.forEach((trait, index) => {
            const priority = allTraits[trait];
            const diversity = this.getDiversityScore(trait);
            console.log(`${index + 1}. ${trait} - Priority: ${priority.toFixed(1)}, Diversity: ${diversity.toFixed(3)}`);
        });
    }
    
    handleKeyboardInput(e) {
        // Only handle keyboard input during question screen
        if (!this.gameActive || this.screens.question.style.display === 'none') {
            return;
        }
        
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.moveSelectionUp();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.moveSelectionDown();
                break;
            case 'Enter':
                e.preventDefault();
                this.selectCurrentAnswer();
                break;
        }
    }
    
    moveSelectionUp() {
        if (this.answerButtons.length === 0) return;
        
        this.selectedAnswerIndex = (this.selectedAnswerIndex - 1 + this.answerButtons.length) % this.answerButtons.length;
        this.updateSelectedAnswer();
    }
    
    moveSelectionDown() {
        if (this.answerButtons.length === 0) return;
        
        this.selectedAnswerIndex = (this.selectedAnswerIndex + 1) % this.answerButtons.length;
        this.updateSelectedAnswer();
    }
    
    updateSelectedAnswer() {
        // Remove selection from all buttons
        this.answerButtons.forEach(button => button.classList.remove('selected'));
        
        // Add selection to current button
        if (this.answerButtons[this.selectedAnswerIndex]) {
            this.answerButtons[this.selectedAnswerIndex].classList.add('selected');
        }
    }
    
    selectCurrentAnswer() {
        if (this.answerButtons[this.selectedAnswerIndex]) {
            const confidence = parseFloat(this.answerButtons[this.selectedAnswerIndex].getAttribute('data-confidence'));
            this.answerQuestion(confidence);
        }
    }
    
    initializeAnswerSelection() {
        // Get all visible answer buttons
        this.answerButtons = Array.from(document.querySelectorAll('.answer-button'));
        
        // Reset selection to first button
        this.selectedAnswerIndex = 0;
        
        // Update visual selection
        this.updateSelectedAnswer();
    }
}

// Initialize when page loads or script loads (if DOM already ready)
function initializePokenator() {
    console.log('Initializing Enhanced Pokénator...');
    window.simpleGame = new SimplePokenatorGame();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePokenator);
} else {
    // DOM is already ready
    initializePokenator();
}
