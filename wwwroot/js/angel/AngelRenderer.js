/**
 * AngelRenderer.js
 * Manages Three.js WebGL scene, transparent renderer, camera, lights,
 * procedural 3D Angel fallback model, and GLTF/GLB loader.
 */
class AngelRenderer {
    constructor(config) {
        this.config = config || {};
        this.container = null;
        this.canvas = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.clock = new THREE.Clock();
        
        // 3D Lights
        this.ambientLight = null;
        this.dirLight = null;
        this.pointLight = null;

        // Model references
        this.modelGroup = new THREE.Group();
        this.angelMesh = null;
        this.leftWingMesh = null;
        this.rightWingMesh = null;
        this.wandMesh = null;

        this.isMobile = window.innerWidth <= 650;
        this.performanceMode = this.isMobile ? 'mobile' : 'desktop';

        this.init();
    }

    init() {
        // Create full screen container
        this.container = document.getElementById('angel-canvas-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'angel-canvas-container';
            document.body.appendChild(this.container);
        }

        // Scene
        this.scene = new THREE.Scene();

        // Camera (PerspectiveCamera)
        const fov = 45;
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 10);

        // WebGLRenderer (Transparent)
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const pixelRatio = this.isMobile ? 1.0 : Math.min(window.devicePixelRatio, 2.0);
        this.renderer.setPixelRatio(pixelRatio);

        if (this.config.shadowEnabled && !this.isMobile) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        // Fix overexposure with proper tone mapping
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        this.container.appendChild(this.renderer.domElement);

        // Lights
        this.setupLights();

        // Add Model Group to Scene
        this.scene.add(this.modelGroup);

        // Position initial model group
        const initPos = this.config.initialPosition || { x: 0, y: 1, z: 0 };
        this.modelGroup.position.set(initPos.x, initPos.y, initPos.z);

        // Build procedural 3D Angel fallback immediately
        this.buildProceduralAngel();

        // Attempt GLB Model Load
        this.loadGLBModel();

        // Window resize listener
        window.addEventListener('resize', () => this.onResize());
    }

    setupLights() {
        // Soft Hemisphere ambient light to preserve body details
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.6);
        this.scene.add(hemiLight);

        // Directional Light with moderate intensity and soft shadows
        this.dirLight = new THREE.DirectionalLight(0xfffaed, 0.8);
        this.dirLight.position.set(5, 10, 7);
        if (this.config.shadowEnabled && !this.isMobile) {
            this.dirLight.castShadow = true;
            this.dirLight.shadow.mapSize.width = 1024;
            this.dirLight.shadow.mapSize.height = 1024;
            this.dirLight.shadow.camera.near = 0.5;
            this.dirLight.shadow.camera.far = 25;
            this.dirLight.shadow.bias = -0.001;
        }
        this.scene.add(this.dirLight);

        // Magic Gold PointLight attached to Angel (subtle glow)
        this.pointLight = new THREE.PointLight(0xfde047, 0.8, 8);
        this.pointLight.position.set(0, 1, 1);
        this.modelGroup.add(this.pointLight);
    }

    buildProceduralAngel() {
        // Clear previous children
        while (this.modelGroup.children.length > 0) {
            this.modelGroup.remove(this.modelGroup.children[0]);
        }
        this.modelGroup.add(this.pointLight);

        // Placeholder group while GLB model finishes loading
        const placeholderGroup = new THREE.Group();
        this.angelMesh = placeholderGroup;
        this.modelGroup.add(this.angelMesh);
    }

    loadGLBModel() {
        if (!THREE.GLTFLoader) return;

        const loader = new THREE.GLTFLoader();
        const modelUrl = this.config.modelUrl || '/models/angel/angel.glb';

        loader.load(
            modelUrl,
            (gltf) => {
                console.log('Successfully loaded GLB Angel Model:', modelUrl);
                // Remove procedural model
                if (this.angelMesh) {
                    this.modelGroup.remove(this.angelMesh);
                }

                const glbScene = gltf.scene;
                glbScene.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // Rotate model to a 3/4 angle (-35 deg) so face, wings, full body, and long tail are all visible
                const rotY = (this.config.modelRotationY !== undefined) ? this.config.modelRotationY : (-35 * Math.PI / 180);
                glbScene.rotation.y = rotY;

                // Provide easy global runtime adjustment if needed
                window.setAngelRotation = (degrees) => {
                    if (this.angelMesh) {
                        this.angelMesh.rotation.y = (degrees * Math.PI) / 180;
                        console.log('Angel model Y rotation set to ' + degrees + ' deg');
                    }
                };

                this.angelMesh = glbScene;
                this.modelGroup.add(this.angelMesh);

                this.updateScale(); // Normalize model scale based on bounding box

                if (this.onModelLoaded) {
                    this.onModelLoaded(gltf);
                }
            },
            undefined,
            (err) => {
                console.log('GLB model not found at ' + modelUrl + '. Using procedural 3D Angel model fallback.');
                this.updateScale();
            }
        );
    }

    animateProceduralWings(delta) {
        if (!this.leftWingMesh || !this.rightWingMesh) return;
        const time = this.clock.getElapsedTime();
        // 3D Butterfly Wing Flap Rotation
        const flapAngle = Math.sin(time * 12) * 0.5;
        this.leftWingMesh.rotation.y = flapAngle;
        this.rightWingMesh.rotation.y = -flapAngle;

        // Animate Arms (gentle floating)
        if (this.leftArmMesh && this.rightArmMesh) {
            this.leftArmMesh.rotation.x = -Math.PI / 5 + Math.sin(time * 3) * 0.15;
            this.rightArmMesh.rotation.x = -Math.PI / 5 + Math.cos(time * 3) * 0.15;
        }

        // Animate Legs (walking/floating motion)
        if (this.leftLegMesh && this.rightLegMesh) {
            this.leftLegMesh.rotation.x = Math.sin(time * 5) * 0.25;
            this.rightLegMesh.rotation.x = -Math.sin(time * 5) * 0.25;
        }

        // Subtle wand float
        if (this.wandMesh) {
            this.wandMesh.rotation.z = -Math.PI / 6 + Math.sin(time * 4) * 0.1;
        }

        // Dynamic Star Trail (rotate fast around wings and pulse)
        if (this.sparklesMesh) {
            this.sparklesMesh.rotation.y -= delta * 2.0; 
            this.sparklesMesh.rotation.z = Math.sin(time * 2) * 0.1; 
            
            // Pulse the stars so they look like they are emitted during a wing flap
            const scalePulse = 0.8 + Math.abs(Math.sin(time * 12)) * 0.4;
            this.sparklesMesh.scale.set(scalePulse, scalePulse, scalePulse);
        }
    }

    updateScale() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.isMobile = width <= 650;
        
        // Responsive visual target height in pixels
        let targetHeightPx = 140; // Desktop
        if (width <= 1024) targetHeightPx = 125; // Tablet
        if (width <= 650) targetHeightPx = 120; // Mobile
        
        // Camera properties: fov=45, distance=10
        const visibleHeightWorld = 2 * Math.tan((45 * Math.PI / 180) / 2) * 10;
        const pixelsPerWorldUnit = height / visibleHeightWorld;
        const targetWorldHeight = targetHeightPx / pixelsPerWorldUnit;
        
        if (this.angelMesh) {
            // Recalculate bounding box
            const box = new THREE.Box3().setFromObject(this.angelMesh);
            const size = box.getSize(new THREE.Vector3());
            
            if (size.y > 0) {
                // Normalize so the mesh's physical Y size matches the target world height
                const scale = targetWorldHeight / size.y;
                this.modelGroup.scale.set(scale, scale, scale);
                
                // Optionally center model vertically around its pivot if it's wildly off
                // But typically just scaling it is enough to make it the right size.
            }
        }
    }

    onResize() {
        if (!this.camera || !this.renderer) return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.updateScale();

        // Ensure it stays snapped to the corner when the screen changes
        if (window.angelController && window.angelController.flight) {
            window.angelController.flight.setPermanentHomePosition();
        }
    }

    render(delta) {
        const d = (delta !== undefined) ? delta : this.clock.getDelta();
        this.animateProceduralWings(d);
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
window.AngelRenderer = AngelRenderer;
