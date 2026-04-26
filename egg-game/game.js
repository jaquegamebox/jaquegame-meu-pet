// ============================================
// EGG GAME - Jogo Interativo de Ovos Encantados
// ============================================

class EggGame {
    constructor() {
        this.elementTypes = {
            water: { name: 'Água', color: 0x1e90ff, lightColor: '#1e90ff', petName: '🐟 Aquário' },
            air: { name: 'Ar', color: 0x87ceeb, lightColor: '#87ceeb', petName: '🦅 Vento' },
            earth: { name: 'Terra', color: 0x8b7355, lightColor: '#8b7355', petName: '🐢 Terroso' },
            fire: { name: 'Fogo', color: 0xff4500, lightColor: '#ff4500', petName: '🔥 Ignício' },
            metal: { name: 'Metal', color: 0xc0c0c0, lightColor: '#c0c0c0', petName: '⚙️ Metálico' }
        };

        this.state = {
            scene: 'eggSelection',
            currentElement: null,
            clickCount: 0,
            maxClicks: 10,
            pets: [],
            maxPets: 2,
            eggRotation: 0,
            particleSystem: null
        };

        this.three = {
            scene: null,
            camera: null,
            renderer: null,
            egg: null,
            lights: []
        };

        this.petThree = {
            scene: null,
            camera: null,
            renderer: null,
            pet: null,
            lights: []
        };

        this.initGame();
    }

    initGame() {
        this.renderEggSelection();
        window.addEventListener('resize', () => this.onWindowResize());
    }

    // ============================================
    // EGG SELECTION SCENE
    // ============================================
    renderEggSelection() {
        this.showScene('eggSelectionScene');
        this.state.scene = 'eggSelection';

        const eggsGrid = document.getElementById('eggsGrid');
        eggsGrid.innerHTML = '';

        Object.entries(this.elementTypes).forEach(([key, element]) => {
            const isDisabled = this.state.pets.length >= this.state.maxPets;
            const eggDiv = document.createElement('div');
            eggDiv.className = `egg-selector ${isDisabled ? 'disabled' : ''}`;
            eggDiv.onclick = () => {
                if (!isDisabled) this.selectEgg(key);
            };

            eggDiv.innerHTML = `
                <div class="egg ${key}-egg">
                    <div class="egg-shine"></div>
                </div>
                <p>${element.name}</p>
            `;

            eggsGrid.appendChild(eggDiv);
        });

        document.getElementById('eggLimit').textContent = this.state.maxPets - this.state.pets.length;
    }

    selectEgg(elementKey) {
        if (this.state.pets.length >= this.state.maxPets) return;

        this.state.currentElement = elementKey;
        this.state.clickCount = 0;
        this.showScene('eggInteractionScene');
        this.state.scene = 'eggInteraction';

        document.getElementById('eggTitle').textContent = `Ovo de ${this.elementTypes[elementKey].name}`;
        document.getElementById('clickCount').textContent = '0';
        document.getElementById('progressFill').style.width = '0%';

        this.initEggScene();
    }

    // ============================================
    // THREE.JS - EGG INTERACTION
    // ============================================
    initEggScene() {
        const canvas = document.getElementById('gameCanvas');
        const container = canvas.parentElement;

        if (this.three.renderer) {
            this.three.renderer.dispose();
            if (container.contains(canvas)) {
                container.removeChild(canvas);
            }
        }

        this.three.scene = new THREE.Scene();
        this.three.scene.background = new THREE.Color(0x87ceeb);

        this.three.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.three.camera.position.z = 3;

        this.three.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.three.renderer.setSize(container.clientWidth, container.clientHeight);
        this.three.renderer.shadowMap.enabled = true;
        container.appendChild(this.three.renderer.domElement);

        this.setupEggLighting();
        this.createEgg();

        canvas.addEventListener('click', () => this.clickEgg());
        this.animateEgg();
    }

    setupEggLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.three.scene.add(ambientLight);

        const element = this.elementTypes[this.state.currentElement];
        const light = new THREE.PointLight(element.color, 1);
        light.position.set(2, 2, 2);
        light.castShadow = true;
        this.three.scene.add(light);
        this.three.lights.push(light);
    }

    createEgg() {
        if (this.three.egg) {
            this.three.scene.remove(this.three.egg);
        }

        this.three.egg = new THREE.Group();

        const geometry = new THREE.SphereGeometry(1, 32, 32);
        geometry.scale(0.8, 1, 0.8);

        const element = this.elementTypes[this.state.currentElement];
        const material = new THREE.MeshPhongMaterial({
            color: element.color,
            emissive: 0x000000,
            shininess: 30,
            flatShading: false
        });

        const egg = new THREE.Mesh(geometry, material);
        egg.castShadow = true;
        egg.receiveShadow = true;

        this.three.egg.add(egg);
        this.three.scene.add(this.three.egg);
    }

    clickEgg() {
        if (this.state.scene !== 'eggInteraction') return;

        this.state.clickCount++;
        document.getElementById('clickCount').textContent = this.state.clickCount;

        const progress = (this.state.clickCount / this.state.maxClicks) * 100;
        document.getElementById('progressFill').style.width = progress + '%';

        this.three.egg.scale.set(1.1, 0.95, 1.1);
        setTimeout(() => {
            this.three.egg.scale.set(1, 1, 1);
        }, 100);

        if (this.three.lights.length > 0) {
            this.three.lights[0].intensity = 1 + this.state.clickCount * 0.2;
        }

        if (this.state.clickCount >= this.state.maxClicks) {
            this.hatchEgg();
        }
    }

    hatchEgg() {
        document.getElementById('gameCanvas').style.pointerEvents = 'none';
        this.createParticleExplosion();

        setTimeout(() => {
            this.showPetScene();
        }, 2000);
    }

    createParticleExplosion() {
        const element = this.elementTypes[this.state.currentElement];
        const particleCount = 50;

        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: element.color,
            size: 0.1,
            transparent: true,
            sizeAttenuation: true
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.three.scene.add(particles);

        const velocities = [];
        for (let i = 0; i < particleCount; i++) {
            velocities.push({
                x: (Math.random() - 0.5) * 0.2,
                y: (Math.random() - 0.5) * 0.2,
                z: (Math.random() - 0.5) * 0.2
            });
        }

        const startTime = Date.now();
        const animateParticles = () => {
            const elapsed = (Date.now() - startTime) / 1000;

            if (elapsed > 2) {
                this.three.scene.remove(particles);
                return;
            }

            const posArray = particles.geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                posArray[i * 3] += velocities[i].x;
                posArray[i * 3 + 1] += velocities[i].y;
                posArray[i * 3 + 2] += velocities[i].z;
            }
            particles.geometry.attributes.position.needsUpdate = true;
            particles.material.opacity = Math.max(0, 1 - elapsed / 2);

            requestAnimationFrame(animateParticles);
        };

        animateParticles();
    }

    animateEgg() {
        const animate = () => {
            if (this.state.scene !== 'eggInteraction') return;

            requestAnimationFrame(animate);

            this.state.eggRotation += 0.005;
            if (this.three.egg) {
                this.three.egg.rotation.y = this.state.eggRotation;
                this.three.egg.position.y = Math.sin(this.state.eggRotation * 0.5) * 0.3;
            }

            if (this.three.lights.length > 0) {
                const light = this.three.lights[0];
                const baseLuminosity = 1 + this.state.clickCount * 0.2;
                light.intensity = baseLuminosity + Math.sin(Date.now() * 0.005) * 0.3;
            }

            this.three.renderer.render(this.three.scene, this.three.camera);
        };

        animate();
    }

    // ============================================
    // PET SCENE
    // ============================================
    showPetScene() {
        this.showScene('petScene');
        this.state.scene = 'petScene';

        const petData = {
            element: this.state.currentElement,
            name: this.elementTypes[this.state.currentElement].petName,
            happiness: 80,
            energy: 70,
            hunger: 30,
            createdAt: new Date()
        };

        this.state.pets.push(petData);

        document.getElementById('petName').textContent = petData.name;
        document.getElementById('petDescription').textContent = `Um adorável companheiro de ${this.elementTypes[this.state.currentElement].name} nasceu!`;
        document.getElementById('happinessFill').style.width = petData.happiness + '%';
        document.getElementById('energyFill').style.width = petData.energy + '%';
        document.getElementById('hungerFill').style.width = petData.hunger + '%';

        this.initPetScene(petData);
    }

    initPetScene(petData) {
        const canvas = document.getElementById('petCanvas');
        const container = canvas.parentElement;

        if (this.petThree.renderer) {
            this.petThree.renderer.dispose();
            if (container.contains(canvas)) {
                container.removeChild(canvas);
            }
        }

        this.petThree.scene = new THREE.Scene();
        this.petThree.scene.background = new THREE.Color(0x87ceeb);

        this.petThree.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.petThree.camera.position.z = 4;

        this.petThree.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.petThree.renderer.setSize(container.clientWidth, container.clientHeight);
        this.petThree.renderer.shadowMap.enabled = true;
        container.appendChild(this.petThree.renderer.domElement);

        this.setupPetLighting();
        this.createPet(petData);
        this.animatePet(petData);
    }

    setupPetLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.petThree.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.petThree.scene.add(directionalLight);

        const element = this.elementTypes[this.state.currentElement];
        const pointLight = new THREE.PointLight(element.color, 0.5);
        pointLight.position.set(-3, 2, 3);
        this.petThree.scene.add(pointLight);
        this.petThree.lights.push(pointLight);
    }

    createPet(petData) {
        if (this.petThree.pet) {
            this.petThree.scene.remove(this.petThree.pet);
        }

        this.petThree.pet = new THREE.Group();

        const element = this.elementTypes[petData.element];
        const material = new THREE.MeshPhongMaterial({
            color: element.color,
            emissive: 0x222222,
            shininess: 60
        });

        this.createCutePet(material, petData.element);
        this.petThree.scene.add(this.petThree.pet);
    }

    createCutePet(material, element) {
        switch (element) {
            case 'water':
                this.createFishPet(material);
                break;
            case 'air':
                this.createBirdPet(material);
                break;
            case 'earth':
                this.createTurtlePet(material);
                break;
            case 'fire':
                this.createFoxPet(material);
                break;
            case 'metal':
                this.createRobotPet(material);
                break;
        }
    }

    createFishPet(material) {
        const bodyGeom = new THREE.OctahedronGeometry(0.5, 2);
        const body = new THREE.Mesh(bodyGeom, material);
        body.scale.set(1.2, 0.8, 0.6);
        this.petThree.pet.add(body);

        const headGeom = new THREE.SphereGeometry(0.4, 16, 16);
        const head = new THREE.Mesh(headGeom, material);
        head.position.x = 0.6;
        this.petThree.pet.add(head);

        const eyeGeom = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const leftEye = new THREE.Mesh(eyeGeom, eyeMaterial);
        leftEye.position.set(0.7, 0.2, 0.35);
        const rightEye = leftEye.clone();
        rightEye.position.z = -0.35;
        this.petThree.pet.add(leftEye);
        this.petThree.pet.add(rightEye);

        const tailGeom = new THREE.ConeGeometry(0.2, 0.8, 8);
        const tail = new THREE.Mesh(tailGeom, material);
        tail.position.x = -0.8;
        tail.rotation.z = Math.PI / 4;
        this.petThree.pet.add(tail);
    }

    createBirdPet(material) {
        const bodyGeom = new THREE.SphereGeometry(0.5, 16, 16);
        const body = new THREE.Mesh(bodyGeom, material);
        body.scale.set(1, 1.2, 0.8);
        this.petThree.pet.add(body);

        const headGeom = new THREE.SphereGeometry(0.35, 16, 16);
        const head = new THREE.Mesh(headGeom, material);
        head.position.y = 0.6;
        this.petThree.pet.add(head);

        const eyeGeom = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(eyeGeom, eyeMaterial);
        leftEye.position.set(-0.15, 0.75, 0.3);
        const rightEye = leftEye.clone();
        rightEye.position.z = -0.3;
        this.petThree.pet.add(leftEye);
        this.petThree.pet.add(rightEye);

        const wingGeom = new THREE.BoxGeometry(0.3, 0.6, 0.1);
        const leftWing = new THREE.Mesh(wingGeom, material);
        leftWing.position.set(-0.2, 0.2, 0.6);
        leftWing.rotation.z = Math.PI / 6;
        const rightWing = leftWing.clone();
        rightWing.position.z = -0.6;
        this.petThree.pet.add(leftWing);
        this.petThree.pet.add(rightWing);
    }

    createTurtlePet(material) {
        const shellGeom = new THREE.SphereGeometry(0.6, 16, 16);
        shellGeom.scale(1.2, 0.6, 1.2);
        const shell = new THREE.Mesh(shellGeom, material);
        this.petThree.pet.add(shell);

        const headGeom = new THREE.SphereGeometry(0.3, 16, 16);
        const head = new THREE.Mesh(headGeom, material);
        head.position.z = 0.8;
        this.petThree.pet.add(head);

        const eyeGeom = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(eyeGeom, eyeMaterial);
        leftEye.position.set(-0.1, 0.15, 0.95);
        const rightEye = leftEye.clone();
        rightEye.position.x = 0.1;
        this.petThree.pet.add(leftEye);
        this.petThree.pet.add(rightEye);

        const legGeom = new THREE.SphereGeometry(0.15, 8, 8);
        const legPositions = [[-0.4, -0.3, -0.3], [0.4, -0.3, -0.3], [-0.4, -0.3, 0.3], [0.4, -0.3, 0.3]];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeom, material);
            leg.position.set(...pos);
            leg.scale.set(0.8, 0.6, 0.8);
            this.petThree.pet.add(leg);
        });
    }

    createFoxPet(material) {
        const bodyGeom = new THREE.CapsuleGeometry(0.4, 0.8, 8, 16);
        const body = new THREE.Mesh(bodyGeom, material);
        this.petThree.pet.add(body);

        const headGeom = new THREE.SphereGeometry(0.4, 16, 16);
        const head = new THREE.Mesh(headGeom, material);
        head.position.y = 0.7;
        this.petThree.pet.add(head);

        const earGeom = new THREE.ConeGeometry(0.15, 0.4, 8);
        const leftEar = new THREE.Mesh(earGeom, material);
        leftEar.position.set(-0.25, 1.1, 0);
        leftEar.rotation.z = -0.3;
        const rightEar = leftEar.clone();
        rightEar.position.x = 0.25;
        rightEar.rotation.z = 0.3;
        this.petThree.pet.add(leftEar);
        this.petThree.pet.add(rightEar);

        const eyeGeom = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFF00 });
        const leftEye = new THREE.Mesh(eyeGeom, eyeMaterial);
        leftEye.position.set(-0.15, 0.8, 0.35);
        const rightEye = leftEye.clone();
        rightEye.position.z = -0.35;
        this.petThree.pet.add(leftEye);
        this.petThree.pet.add(rightEye);

        const tailGeom = new THREE.SphereGeometry(0.25, 16, 16);
        tailGeom.scale(0.6, 1.5, 0.6);
        const tail = new THREE.Mesh(tailGeom, material);
        tail.position.y = -0.5;
        this.petThree.pet.add(tail);
    }

    createRobotPet(material) {
        const bodyGeom = new THREE.BoxGeometry(0.6, 0.8, 0.5);
        const body = new THREE.Mesh(bodyGeom, material);
        this.petThree.pet.add(body);

        const headGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const head = new THREE.Mesh(headGeom, material);
        head.position.y = 0.8;
        this.petThree.pet.add(head);

        const eyeGeom = new THREE.BoxGeometry(0.1, 0.1, 0.05);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00, emissive: 0x00FF00 });
        const leftEye = new THREE.Mesh(eyeGeom, eyeMaterial);
        leftEye.position.set(-0.1, 0.9, 0.28);
        const rightEye = leftEye.clone();
        rightEye.position.x = 0.1;
        this.petThree.pet.add(leftEye);
        this.petThree.pet.add(rightEye);

        const antennaGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
        const antenna = new THREE.Mesh(antennaGeom, material);
        antenna.position.set(0, 1.4, 0);
        this.petThree.pet.add(antenna);

        const footGeom = new THREE.BoxGeometry(0.15, 0.15, 0.4);
        const leftFoot = new THREE.Mesh(footGeom, material);
        leftFoot.position.set(-0.25, -0.5, 0);
        const rightFoot = leftFoot.clone();
        rightFoot.position.x = 0.25;
        this.petThree.pet.add(leftFoot);
        this.petThree.pet.add(rightFoot);
    }

    animatePet(petData) {
        let time = 0;
        const animate = () => {
            if (this.state.scene !== 'petScene') return;

            requestAnimationFrame(animate);
            time += 0.01;

            if (this.petThree.pet) {
                this.petThree.pet.rotation.y = Math.sin(time * 0.5) * 0.3;
                this.petThree.pet.position.y = Math.sin(time * 0.7) * 0.2;
            }

            this.petThree.renderer.render(this.petThree.scene, this.petThree.camera);
        };

        animate();
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    goToEggSelection() {
        this.showScene('eggSelectionScene');
        this.state.scene = 'eggSelection';
        this.state.clickCount = 0;
        this.state.eggRotation = 0;

        if (this.three.renderer) {
            this.three.renderer.dispose();
            const canvas = document.getElementById('gameCanvas');
            if (canvas && canvas.parentElement.contains(canvas)) {
                canvas.parentElement.removeChild(canvas);
            }
        }

        if (this.petThree.renderer) {
            this.petThree.renderer.dispose();
            const canvas = document.getElementById('petCanvas');
            if (canvas && canvas.parentElement.contains(canvas)) {
                canvas.parentElement.removeChild(canvas);
            }
        }

        this.renderEggSelection();
    }

    showScene(sceneName) {
        document.querySelectorAll('.scene').forEach(scene => {
            scene.classList.remove('active');
        });
        document.getElementById(sceneName).classList.add('active');
    }

    onWindowResize() {
        if (this.state.scene === 'eggInteraction' && this.three.renderer) {
            const container = document.getElementById('gameCanvas').parentElement;
            const width = container.clientWidth;
            const height = container.clientHeight;

            this.three.camera.aspect = width / height;
            this.three.camera.updateProjectionMatrix();
            this.three.renderer.setSize(width, height);
        }

        if (this.state.scene === 'petScene' && this.petThree.renderer) {
            const container = document.getElementById('petCanvas').parentElement;
            const width = container.clientWidth;
            const height = container.clientHeight;

            this.petThree.camera.aspect = width / height;
            this.petThree.camera.updateProjectionMatrix();
            this.petThree.renderer.setSize(width, height);
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new EggGame();
});