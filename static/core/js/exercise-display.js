/**
 * Exercise Display System
 * Handles rendering and interaction with exercise cards and modals
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize exercise cards if available
    initializeExerciseCards();
    
    // Set up modal close functionality
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close-exercise-modal') || 
            e.target.closest('.close-exercise-modal')) {
            closeExerciseModal();
        }
    });
    
    // Close modal when clicking outside content
    document.addEventListener('click', function(e) {
        const modal = document.querySelector('.modern-exercise-modal.active');
        if (modal && !e.target.closest('.modal-content') && 
            !e.target.closest('.view-details-btn')) {
            closeExerciseModal();
        }
    });
});

/**
 * Initialize all exercise cards in the document
 */
function initializeExerciseCards() {
    // Find container elements that should have exercise cards
    const containers = document.querySelectorAll('[data-exercise-container]');
    
    containers.forEach(container => {
        const exerciseType = container.dataset.exerciseType || 'general';
        const count = parseInt(container.dataset.exerciseCount || '3');
        
        // Get exercise data based on type
        const exercises = getExercisesByType(exerciseType, count);
        
        // Render exercises
        renderExerciseCards(container, exercises);
    });
}

/**
 * Get exercise data by type
 * @param {string} type - Type of exercises to get
 * @param {number} count - Number of exercises to return
 * @returns {Array} List of exercise objects
 */
function getExercisesByType(type, count) {
    const exercisesByType = {
        cardio: [
            {
                name: "Jumping Jacks",
                icon: "running",
                sets: "3",
                reps: "60s",
                rest: "20s",
                description: "A full-body exercise that increases your heart rate while working multiple muscle groups simultaneously.",
                svgUrl: "/static/core/svg/jumping-jacks.svg",
                instructions: [
                    "Start with your feet together and arms by your sides.",
                    "Jump while raising your arms above your head and spreading your feet wider than hip-width apart.",
                    "Quickly reverse the movement by jumping again to bring your arms and legs back to the starting position.",
                    "Continue at a brisk, controlled pace."
                ]
            },
            {
                name: "High Knees",
                icon: "running",
                sets: "3",
                reps: "45s",
                rest: "30s",
                description: "An intense cardio exercise that strengthens your legs while elevating your heart rate and burning calories.",
                svgUrl: "/static/core/svg/high-knees.svg",
                instructions: [
                    "Stand with your feet hip-width apart.",
                    "Run in place, bringing your knees up toward your chest as high as possible.",
                    "Pump your arms to increase intensity.",
                    "Keep your core engaged and maintain good posture throughout."
                ]
            },
            {
                name: "Mountain Climbers",
                icon: "hiking",
                sets: "3",
                reps: "45s",
                rest: "30s",
                description: "A dynamic full-body exercise that strengthens multiple muscle groups while increasing your heart rate.",
                svgUrl: "/static/core/svg/high-knees.svg",
                instructions: [
                    "Start in a push-up position with arms straight and body in a straight line.",
                    "Keeping your core tight, quickly drive one knee toward your chest.",
                    "Return that leg to the starting position while simultaneously driving the other knee forward.",
                    "Continue alternating at a fast pace, as if running in place in a plank position."
                ]
            }
        ],
        strength: [
            {
                name: "Squats",
                icon: "dumbbell",
                sets: "3",
                reps: "12-15",
                rest: "60s",
                description: "A fundamental lower body exercise that targets your quadriceps, hamstrings, and glutes for strength and power.",
                svgUrl: "/static/core/svg/squats.svg",
                instructions: [
                    "Stand with feet shoulder-width apart, toes slightly turned out.",
                    "Keep your chest up and back straight.",
                    "Lower your body as if sitting in a chair, aiming to get thighs parallel to the ground.",
                    "Keep your knees in line with your toes, not pushed forward beyond them.",
                    "Push through your heels to return to the starting position."
                ]
            },
            {
                name: "Push-ups",
                icon: "dumbbell",
                sets: "3",
                reps: "10-12",
                rest: "60s",
                description: "An effective upper body exercise that targets your chest, shoulders, triceps, and core muscles.",
                svgUrl: "/static/core/svg/push-ups.svg",
                instructions: [
                    "Start in a plank position with your hands slightly wider than shoulder-width apart.",
                    "Keep your body in a straight line from head to heels.",
                    "Lower your chest toward the floor by bending your elbows.",
                    "Push back up to the starting position.",
                    "For beginners, modify by doing push-ups on your knees."
                ]
            },
            {
                name: "Plank",
                icon: "dumbbell",
                sets: "3",
                reps: "30-60s",
                rest: "45s",
                description: "A core-strengthening isometric exercise that also works your shoulders, arms, and glutes.",
                svgUrl: "/static/core/svg/plank.svg",
                instructions: [
                    "Start by placing your forearms on the ground, elbows below shoulders.",
                    "Extend your legs behind you, balancing on the balls of your feet.",
                    "Form a straight line with your body from head to heels.",
                    "Keep your core engaged and don't let your hips sag or lift too high.",
                    "Hold the position while breathing steadily."
                ]
            }
        ],
        general: [
            {
                name: "Jumping Jacks",
                icon: "running",
                sets: "3",
                reps: "60s",
                rest: "20s",
                description: "A full-body exercise that increases your heart rate while working multiple muscle groups simultaneously.",
                svgUrl: "/static/core/svg/jumping-jacks.svg",
                instructions: [
                    "Start with your feet together and arms by your sides.",
                    "Jump while raising your arms above your head and spreading your feet wider than hip-width apart.",
                    "Quickly reverse the movement by jumping again to bring your arms and legs back to the starting position.",
                    "Continue at a brisk, controlled pace."
                ]
            },
            {
                name: "Squats",
                icon: "dumbbell",
                sets: "3",
                reps: "12-15",
                rest: "60s",
                description: "A fundamental lower body exercise that targets your quadriceps, hamstrings, and glutes for strength and power.",
                svgUrl: "/static/core/svg/squats.svg",
                instructions: [
                    "Stand with feet shoulder-width apart, toes slightly turned out.",
                    "Keep your chest up and back straight.",
                    "Lower your body as if sitting in a chair, aiming to get thighs parallel to the ground.",
                    "Keep your knees in line with your toes, not pushed forward beyond them.",
                    "Push through your heels to return to the starting position."
                ]
            },
            {
                name: "Push-ups",
                icon: "dumbbell",
                sets: "3",
                reps: "10-12",
                rest: "60s",
                description: "An effective upper body exercise that targets your chest, shoulders, triceps, and core muscles.",
                svgUrl: "/static/core/svg/push-ups.svg",
                instructions: [
                    "Start in a plank position with your hands slightly wider than shoulder-width apart.",
                    "Keep your body in a straight line from head to heels.",
                    "Lower your chest toward the floor by bending your elbows.",
                    "Push back up to the starting position.",
                    "For beginners, modify by doing push-ups on your knees."
                ]
            }
        ]
    };
    
    // Return requested exercises
    const available = exercisesByType[type] || exercisesByType.general;
    return available.slice(0, count);
}

/**
 * Render exercise cards into a container
 * @param {HTMLElement} container - Container element to render into 
 * @param {Array} exercises - List of exercise objects
 */
function renderExerciseCards(container, exercises) {
    // Create a grid container
    const grid = document.createElement('div');
    grid.className = 'exercise-grid';
    
    // Add each exercise card
    exercises.forEach(exercise => {
        grid.appendChild(createExerciseCard(exercise));
    });
    
    // Add grid to container
    container.appendChild(grid);
}

/**
 * Create a single exercise card
 * @param {Object} exercise - Exercise data
 * @returns {HTMLElement} The card element
 */
function createExerciseCard(exercise) {
    const card = document.createElement('div');
    card.className = 'modern-exercise-card';
    card.dataset.exercise = JSON.stringify(exercise);
    
    card.innerHTML = `
        <div class="exercise-header">
            <div class="exercise-icon">
                <i class="fas fa-${exercise.icon || 'dumbbell'}"></i>
            </div>
            <h3 class="exercise-title">${exercise.name}</h3>
        </div>
        <div class="exercise-figure">
            <img src="${exercise.svgUrl}" alt="${exercise.name}" class="exercise-svg">
        </div>
        <div class="exercise-info">
            <div class="exercise-meta">
                <div class="meta-item">
                    <span class="meta-label">Sets</span>
                    <span class="meta-value">${exercise.sets}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Reps</span>
                    <span class="meta-value">${exercise.reps}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Rest</span>
                    <span class="meta-value">${exercise.rest}</span>
                </div>
            </div>
            <p class="exercise-description">${exercise.description}</p>
            <button class="view-details-btn" onclick="showExerciseDetails(this)">
                <i class="fas fa-info-circle"></i> View Details
            </button>
        </div>
    `;
    
    return card;
}

/**
 * Show exercise details in a modal
 * @param {HTMLElement} btn - Button element that was clicked
 */
function showExerciseDetails(btn) {
    const card = btn.closest('.modern-exercise-card');
    const exercise = JSON.parse(card.dataset.exercise);
    
    // Create modal if it doesn't exist
    let modal = document.querySelector('.modern-exercise-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modern-exercise-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title" id="exerciseModalTitle"></h3>
                    <button class="close-btn close-exercise-modal" aria-label="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="exercise-illustration">
                        <img id="exerciseModalImage" src="" alt="">
                    </div>
                    <h4 class="instructions-title">Instructions:</h4>
                    <ol class="instructions-list" id="exerciseModalInstructions"></ol>
                    
                    <div class="tips-section">
                        <h4 class="tips-title">Tips:</h4>
                        <p class="tips-text">
                            Start with fewer repetitions and perfect your form before increasing the volume.
                            Always warm up before beginning your workout and stay properly hydrated.
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Update modal content
    document.getElementById('exerciseModalTitle').textContent = exercise.name;
    document.getElementById('exerciseModalImage').src = exercise.svgUrl;
    document.getElementById('exerciseModalImage').alt = exercise.name;
    
    // Set instructions
    const instructionsList = document.getElementById('exerciseModalInstructions');
    instructionsList.innerHTML = '';
    
    exercise.instructions.forEach(instruction => {
        const item = document.createElement('li');
        item.className = 'instruction-item';
        item.textContent = instruction;
        instructionsList.appendChild(item);
    });
    
    // Show the modal
    modal.classList.add('active');
}

/**
 * Close the exercise modal
 */
function closeExerciseModal() {
    const modal = document.querySelector('.modern-exercise-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Make functions available globally
window.showExerciseDetails = showExerciseDetails;
window.closeExerciseModal = closeExerciseModal;