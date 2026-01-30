// Storage module for What Now? app
const Storage = {
    KEYS: {
        TASKS: 'whatnow_tasks',
        TASK_TYPES: 'whatnow_types',
        STATS: 'whatnow_stats'
    },

    // Default task types
    DEFAULT_TYPES: [
        'Chores',
        'Work',
        'Health',
        'Admin',
        'Errand',
        'Self-care',
        'Creative',
        'Social'
    ],

    // Fallback tasks when no user tasks match
    FALLBACK_TASKS: [
        { name: 'Go for a short walk', desc: 'Fresh air helps clear the mind', type: 'Health', time: 15, social: 'low', energy: 'low' },
        { name: 'Check the post', desc: 'Quick and easy win', type: 'Errand', time: 5, social: 'low', energy: 'low' },
        { name: 'Hoover one room', desc: 'Just one room, not the whole house', type: 'Chores', time: 15, social: 'low', energy: 'medium' },
        { name: 'Do the dishes', desc: 'Clear the sink, clear the mind', type: 'Chores', time: 15, social: 'low', energy: 'low' },
        { name: 'Drink a glass of water', desc: 'Stay hydrated', type: 'Health', time: 5, social: 'low', energy: 'low' },
        { name: 'Stretch for 5 minutes', desc: 'Your body will thank you', type: 'Health', time: 5, social: 'low', energy: 'low' },
        { name: 'Tidy your desk', desc: 'A clear space for a clear mind', type: 'Chores', time: 15, social: 'low', energy: 'low' },
        { name: 'Take out the rubbish', desc: 'One less thing to think about', type: 'Chores', time: 5, social: 'low', energy: 'low' },
        { name: 'Water the plants', desc: 'They need you', type: 'Chores', time: 5, social: 'low', energy: 'low' },
        { name: 'Reply to one message', desc: 'Just one, you can do it', type: 'Social', time: 5, social: 'medium', energy: 'low' },
        { name: 'Make your bed', desc: 'Start with a quick win', type: 'Chores', time: 5, social: 'low', energy: 'low' },
        { name: 'Clear kitchen counter', desc: 'Just the counter, nothing else', type: 'Chores', time: 10, social: 'low', energy: 'low' }
    ],

    // Initialize storage with defaults if needed
    init() {
        if (!localStorage.getItem(this.KEYS.TASK_TYPES)) {
            localStorage.setItem(this.KEYS.TASK_TYPES, JSON.stringify(this.DEFAULT_TYPES));
        }
        if (!localStorage.getItem(this.KEYS.TASKS)) {
            localStorage.setItem(this.KEYS.TASKS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.STATS)) {
            localStorage.setItem(this.KEYS.STATS, JSON.stringify({ completed: 0, skipped: 0 }));
        }
    },

    // Task Types
    getTaskTypes() {
        return JSON.parse(localStorage.getItem(this.KEYS.TASK_TYPES)) || this.DEFAULT_TYPES;
    },

    addTaskType(type) {
        const types = this.getTaskTypes();
        if (!types.includes(type)) {
            types.push(type);
            localStorage.setItem(this.KEYS.TASK_TYPES, JSON.stringify(types));
        }
        return types;
    },

    removeTaskType(type) {
        const types = this.getTaskTypes().filter(t => t !== type);
        localStorage.setItem(this.KEYS.TASK_TYPES, JSON.stringify(types));
        return types;
    },

    // Tasks
    getTasks() {
        return JSON.parse(localStorage.getItem(this.KEYS.TASKS)) || [];
    },

    addTask(task) {
        const tasks = this.getTasks();
        task.id = Date.now().toString();
        task.created = new Date().toISOString();
        task.timesShown = 0;
        task.timesSkipped = 0;
        task.timesCompleted = 0;
        tasks.push(task);
        localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
        return task;
    },

    updateTask(id, updates) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates };
            localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
            return tasks[index];
        }
        return null;
    },

    deleteTask(id) {
        const tasks = this.getTasks().filter(t => t.id !== id);
        localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
        return tasks;
    },

    // Find matching tasks based on current state
    findMatchingTasks(energy, social, time) {
        const tasks = this.getTasks();
        const energyLevels = { low: 1, medium: 2, high: 3 };
        const socialLevels = { low: 1, medium: 2, high: 3 };

        // Filter tasks that match current state
        // Task requires X energy/social, user has Y - user can do task if Y >= X
        const matching = tasks.filter(task => {
            const energyMatch = energyLevels[energy] >= energyLevels[task.energy];
            const socialMatch = socialLevels[social] >= socialLevels[task.social];
            const timeMatch = time >= task.time;
            return energyMatch && socialMatch && timeMatch;
        });

        // Sort by times skipped (prioritize avoided tasks) then by times shown
        matching.sort((a, b) => {
            const skipDiff = b.timesSkipped - a.timesSkipped;
            if (skipDiff !== 0) return skipDiff;
            return a.timesShown - b.timesShown;
        });

        return matching;
    },

    // Get fallback tasks that match current state
    getFallbackTasks(energy, social, time) {
        const energyLevels = { low: 1, medium: 2, high: 3 };
        const socialLevels = { low: 1, medium: 2, high: 3 };

        return this.FALLBACK_TASKS.filter(task => {
            const energyMatch = energyLevels[energy] >= energyLevels[task.energy];
            const socialMatch = socialLevels[social] >= socialLevels[task.social];
            const timeMatch = time >= task.time;
            return energyMatch && socialMatch && timeMatch;
        }).map(task => ({
            ...task,
            id: 'fallback_' + Math.random().toString(36).substr(2, 9),
            isFallback: true
        }));
    },

    // Stats
    getStats() {
        return JSON.parse(localStorage.getItem(this.KEYS.STATS)) || { completed: 0, skipped: 0 };
    },

    incrementCompleted() {
        const stats = this.getStats();
        stats.completed++;
        localStorage.setItem(this.KEYS.STATS, JSON.stringify(stats));
        return stats;
    },

    incrementSkipped() {
        const stats = this.getStats();
        stats.skipped++;
        localStorage.setItem(this.KEYS.STATS, JSON.stringify(stats));
        return stats;
    }
};

// Initialize on load
Storage.init();
