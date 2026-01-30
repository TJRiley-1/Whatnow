// What Now? App - Main Application Logic

const App = {
    // Current state
    currentScreen: 'home',
    newTask: {},
    currentState: {
        energy: null,
        social: null,
        time: null
    },
    matchingTasks: [],
    currentCardIndex: 0,
    acceptedTask: null,

    // Initialize the app
    init() {
        this.bindEvents();
        this.renderTaskTypes();
        this.showScreen('home');
    },

    // Screen navigation
    showScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            if (screen.id === `screen-${screenId}`) {
                screen.classList.add('active');
                screen.classList.remove('exiting');
            } else if (screen.classList.contains('active')) {
                screen.classList.add('exiting');
                screen.classList.remove('active');
            } else {
                screen.classList.remove('exiting');
            }
        });
        this.currentScreen = screenId;

        // Screen-specific setup
        if (screenId === 'manage') {
            this.renderTaskList();
        }
    },

    // Event binding
    bindEvents() {
        // Home screen buttons
        document.getElementById('btn-add-task').addEventListener('click', () => {
            this.newTask = {};
            this.showScreen('add-type');
        });

        document.getElementById('btn-what-next').addEventListener('click', () => {
            this.resetCurrentState();
            this.showScreen('state');
        });

        document.getElementById('btn-manage-tasks').addEventListener('click', () => {
            this.showScreen('manage');
        });

        // Back buttons
        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.back;
                this.showScreen(target);
            });
        });

        // Task type selection
        document.getElementById('task-types').addEventListener('click', (e) => {
            if (e.target.classList.contains('type-option')) {
                this.newTask.type = e.target.dataset.value;
                this.showScreen('add-time');
            }
        });

        // Add custom type
        document.getElementById('btn-add-custom-type').addEventListener('click', () => {
            document.getElementById('modal-custom-type').classList.remove('hidden');
            document.getElementById('custom-type-input').focus();
        });

        document.getElementById('btn-cancel-type').addEventListener('click', () => {
            document.getElementById('modal-custom-type').classList.add('hidden');
            document.getElementById('custom-type-input').value = '';
        });

        document.getElementById('btn-confirm-type').addEventListener('click', () => {
            const input = document.getElementById('custom-type-input');
            const typeName = input.value.trim();
            if (typeName) {
                Storage.addTaskType(typeName);
                this.renderTaskTypes();
                input.value = '';
                document.getElementById('modal-custom-type').classList.add('hidden');
            }
        });

        // Time selection
        document.querySelectorAll('.time-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.newTask.time = parseInt(btn.dataset.value);
                this.showScreen('add-social');
            });
        });

        // Social battery selection (Add Task)
        document.getElementById('screen-add-social').querySelectorAll('.level-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.newTask.social = btn.dataset.value;
                this.showScreen('add-energy');
            });
        });

        // Energy level selection (Add Task)
        document.getElementById('screen-add-energy').querySelectorAll('.level-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.newTask.energy = btn.dataset.value;
                this.showScreen('add-details');
            });
        });

        // Save task
        document.getElementById('btn-save-task').addEventListener('click', () => {
            const name = document.getElementById('task-name').value.trim();
            const desc = document.getElementById('task-desc').value.trim();

            if (name) {
                this.newTask.name = name;
                this.newTask.desc = desc;
                Storage.addTask(this.newTask);

                // Clear form
                document.getElementById('task-name').value = '';
                document.getElementById('task-desc').value = '';
                this.newTask = {};

                this.showScreen('home');
            }
        });

        // State selection (What Next flow)
        document.querySelectorAll('.state-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const value = btn.dataset.value;

                // Update state
                this.currentState[type] = type === 'time' ? parseInt(value) : value;

                // Update button styles
                const row = btn.parentElement;
                row.querySelectorAll('.state-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');

                // Enable find button if all selected
                this.updateFindButtonState();
            });
        });

        // Find task button
        document.getElementById('btn-find-task').addEventListener('click', () => {
            this.findAndShowTasks();
        });

        // Accepted task buttons
        document.getElementById('btn-done').addEventListener('click', () => {
            if (this.acceptedTask) {
                if (!this.acceptedTask.isFallback) {
                    Storage.updateTask(this.acceptedTask.id, {
                        timesCompleted: (this.acceptedTask.timesCompleted || 0) + 1
                    });
                }
                Storage.incrementCompleted();
                this.showScreen('home');
            }
        });

        document.getElementById('btn-not-now').addEventListener('click', () => {
            this.showScreen('swipe');
        });

        // No tasks back button
        document.querySelector('#no-tasks-message .btn').addEventListener('click', () => {
            this.showScreen('home');
        });
    },

    // Reset current state selections
    resetCurrentState() {
        this.currentState = { energy: null, social: null, time: null };
        document.querySelectorAll('.state-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('btn-find-task').disabled = true;
    },

    // Check if all state options are selected
    updateFindButtonState() {
        const allSelected = this.currentState.energy && this.currentState.social && this.currentState.time;
        document.getElementById('btn-find-task').disabled = !allSelected;
    },

    // Render task types
    renderTaskTypes() {
        const container = document.getElementById('task-types');
        const types = Storage.getTaskTypes();

        container.innerHTML = types.map(type => `
            <button class="option-btn type-option" data-value="${type}">${type}</button>
        `).join('');
    },

    // Render task list (Manage screen)
    renderTaskList() {
        const container = document.getElementById('task-list');
        const noTasks = document.getElementById('no-tasks-yet');
        const tasks = Storage.getTasks();

        if (tasks.length === 0) {
            container.classList.add('hidden');
            noTasks.classList.remove('hidden');
            return;
        }

        container.classList.remove('hidden');
        noTasks.classList.add('hidden');

        container.innerHTML = tasks.map(task => `
            <div class="task-item" data-id="${task.id}">
                <div class="task-item-content">
                    <div class="task-item-name">${this.escapeHtml(task.name)}</div>
                    <div class="task-item-meta">
                        ${task.type} · ${task.time} min · Energy: ${task.energy} · Social: ${task.social}
                    </div>
                </div>
                <button class="task-item-delete" data-id="${task.id}">×</button>
            </div>
        `).join('');

        // Bind delete buttons
        container.querySelectorAll('.task-item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                Storage.deleteTask(btn.dataset.id);
                this.renderTaskList();
            });
        });
    },

    // Find matching tasks and show swipe screen
    findAndShowTasks() {
        const { energy, social, time } = this.currentState;

        // Get matching user tasks
        let tasks = Storage.findMatchingTasks(energy, social, time);

        // If no user tasks, get fallback tasks
        if (tasks.length === 0) {
            tasks = Storage.getFallbackTasks(energy, social, time);
        }

        // Shuffle for variety
        tasks = this.shuffleArray(tasks);

        this.matchingTasks = tasks;
        this.currentCardIndex = 0;

        if (tasks.length > 0) {
            this.showScreen('swipe');
            this.renderCards();
        } else {
            // No tasks at all - shouldn't happen with fallbacks
            this.showScreen('home');
        }
    },

    // Render swipe cards
    renderCards() {
        const stack = document.getElementById('card-stack');
        const noTasks = document.getElementById('no-tasks-message');

        // Get remaining tasks
        const remaining = this.matchingTasks.slice(this.currentCardIndex);

        if (remaining.length === 0) {
            stack.classList.add('hidden');
            noTasks.classList.remove('hidden');
            return;
        }

        stack.classList.remove('hidden');
        noTasks.classList.add('hidden');

        // Show only top 2 cards for performance
        const cardsToShow = remaining.slice(0, 2).reverse();

        stack.innerHTML = cardsToShow.map((task, i) => `
            <div class="swipe-card" data-index="${this.currentCardIndex + cardsToShow.length - 1 - i}" style="z-index: ${i + 1}">
                <span class="card-type">${this.escapeHtml(task.type)}${task.isFallback ? ' (Suggestion)' : ''}</span>
                <h3 class="card-title">${this.escapeHtml(task.name)}</h3>
                <p class="card-desc">${this.escapeHtml(task.desc || 'No description')}</p>
                <div class="card-meta">
                    <span class="card-meta-item">⏱ ${task.time} min</span>
                    <span class="card-meta-item">⚡ ${task.energy}</span>
                    <span class="card-meta-item">👥 ${task.social}</span>
                </div>
            </div>
        `).join('');

        // Initialize swipe on top card
        const topCard = stack.querySelector('.swipe-card:last-child');
        if (topCard) {
            this.initSwipe(topCard);
        }
    },

    // Initialize swipe gestures on a card
    initSwipe(card) {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let isDragging = false;

        const onStart = (e) => {
            isDragging = true;
            startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
            startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
            card.classList.add('dragging');
        };

        const onMove = (e) => {
            if (!isDragging) return;

            const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
            currentX = clientX - startX;

            // Apply transform
            const rotation = currentX * 0.1;
            card.style.transform = `translateX(${currentX}px) rotate(${rotation}deg)`;

            // Visual feedback
            card.classList.remove('swiping-left', 'swiping-right');
            if (currentX < -50) {
                card.classList.add('swiping-left');
            } else if (currentX > 50) {
                card.classList.add('swiping-right');
            }
        };

        const onEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            card.classList.remove('dragging');

            const threshold = 100;

            if (currentX < -threshold) {
                // Swiped left - skip
                this.animateCardOut(card, 'left');
            } else if (currentX > threshold) {
                // Swiped right - accept
                this.animateCardOut(card, 'right');
            } else {
                // Return to center
                card.style.transform = '';
                card.classList.remove('swiping-left', 'swiping-right');
            }
        };

        // Mouse events
        card.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);

        // Touch events
        card.addEventListener('touchstart', onStart, { passive: true });
        card.addEventListener('touchmove', onMove, { passive: true });
        card.addEventListener('touchend', onEnd);
    },

    // Animate card off screen
    animateCardOut(card, direction) {
        const task = this.matchingTasks[this.currentCardIndex];
        const translateX = direction === 'left' ? -500 : 500;
        const rotation = direction === 'left' ? -30 : 30;

        card.style.transition = 'transform 0.3s ease';
        card.style.transform = `translateX(${translateX}px) rotate(${rotation}deg)`;

        setTimeout(() => {
            if (direction === 'right') {
                // Accepted
                this.acceptedTask = task;
                if (!task.isFallback) {
                    Storage.updateTask(task.id, {
                        timesShown: (task.timesShown || 0) + 1
                    });
                }
                this.showAcceptedTask();
            } else {
                // Skipped
                if (!task.isFallback) {
                    Storage.updateTask(task.id, {
                        timesShown: (task.timesShown || 0) + 1,
                        timesSkipped: (task.timesSkipped || 0) + 1
                    });
                }
                Storage.incrementSkipped();
                this.currentCardIndex++;
                this.renderCards();
            }
        }, 300);
    },

    // Show accepted task screen
    showAcceptedTask() {
        const container = document.getElementById('accepted-task');
        container.innerHTML = `
            <div class="task-name">${this.escapeHtml(this.acceptedTask.name)}</div>
            ${this.acceptedTask.desc ? `<div class="task-desc">${this.escapeHtml(this.acceptedTask.desc)}</div>` : ''}
        `;
        this.showScreen('accepted');
    },

    // Utility: Shuffle array
    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    // Utility: Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
