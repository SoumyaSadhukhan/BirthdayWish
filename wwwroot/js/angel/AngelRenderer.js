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

        const angelBodyGroup = new THREE.Group();

        // 1. Head
        const headGeo = new THREE.SphereGeometry(0.35, 32, 32);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xffedd5,
            roughness: 0.3,
            metalness: 0.1
        });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.y = 0.9;
        angelBodyGroup.add(headMesh);

        // Glowing Golden Halo (Torus)
        const haloGeo = new THREE.TorusGeometry(0.28, 0.04, 16, 32);
        const haloMat = new THREE.MeshStandardMaterial({
            color: 0xfde047,
            emissive: 0xfde047,
            emissiveIntensity: 0.8,
            roughness: 0.1
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.rotation.x = Math.PI / 2;
        haloMesh.position.y = 1.35;
        angelBodyGroup.add(haloMesh);

        // 2. Dress / Torso (Cone/Cylinder)
        const dressGeo = new THREE.ConeGeometry(0.55, 1.2, 32);
        const dressMat = new THREE.MeshStandardMaterial({
            color: 0xf472b6,
            roughness: 0.4,
            metalness: 0.2,
            emissive: 0xdb2777,
            emissiveIntensity: 0.2
        });
        const dressMesh = new THREE.Mesh(dressGeo, dressMat);
        dressMesh.position.y = 0.2;
        angelBodyGroup.add(dressMesh);

        // 3. Arms & Magic Wand
        const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xffedd5 });
        
        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.set(0.4, 0.5, 0.1);
        rightArm.rotation.z = -Math.PI / 4;
        angelBodyGroup.add(rightArm);

        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.set(-0.4, 0.5, 0.1);
        leftArm.rotation.z = Math.PI / 4;
        angelBodyGroup.add(leftArm);

        // Wand
        const wandGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8);
        const wandMat = new THREE.MeshStandardMaterial({ color: 0xfde047, metalness: 0.8 });
        this.wandMesh = new THREE.Mesh(wandGeo, wandMat);
        this.wandMesh.position.set(0.6, 0.7, 0.2);
        this.wandMesh.rotation.z = -Math.PI / 6;
        angelBodyGroup.add(this.wandMesh);

        // Star tip on wand
        const starTipGeo = new THREE.OctahedronGeometry(0.12);
        const starTipMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xfde047,
            emissiveIntensity: 1.0
        });
        const starTip = new THREE.Mesh(starTipGeo, starTipMat);
        starTip.position.y = 0.35;
        this.wandMesh.add(starTip);

        // 4. 3D Wings System (Left & Right Articulated Wing Pivot Groups)
        this.leftWingMesh = new THREE.Group();
        this.leftWingMesh.position.set(-0.25, 0.5, -0.2);

        this.rightWingMesh = new THREE.Group();
        this.rightWingMesh.position.set(0.25, 0.5, -0.2);

        // Wing Feathers Mesh Shape
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.quadraticCurveTo(-0.6, 0.8, -1.2, 0.6);
        wingShape.quadraticCurveTo(-1.0, 0.1, -0.7, -0.4);
        wingShape.quadraticCurveTo(-0.3, -0.5, 0, 0);

        const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02 });
        const wingMat = new THREE.MeshStandardMaterial({
            color: 0xfff0f5,
            emissive: 0xfbcfe8,
            emissiveIntensity: 0.4,
            roughness: 0.2,
            transparent: true,
            opacity: 0.92
        });

        const leftFeather = new THREE.Mesh(wingGeo, wingMat);
        this.leftWingMesh.add(leftFeather);

        const rightFeather = new THREE.Mesh(wingGeo, wingMat);
        rightFeather.scale.set(-1, 1, 1);
        this.rightWingMesh.add(rightFeather);

        angelBodyGroup.add(this.leftWingMesh);
        angelBodyGroup.add(this.rightWingMesh);

        this.angelMesh = angelBodyGroup;
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
        // 3D Wing Flap Rotation
        const flapAngle = Math.sin(time * 12) * 0.45;
        this.leftWingMesh.rotation.y = flapAngle;
        this.rightWingMesh.rotation.y = -flapAngle;

        // Subtle wand float
        if (this.wandMesh) {
            this.wandMesh.rotation.z = -Math.PI / 6 + Math.sin(time * 4) * 0.1;
        }
    }

    updateScale() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.isMobile = width <= 650;
        
        // Responsive visual target height in pixels (significantly smaller)
        let targetHeightPx = 140; // Desktop
        if (width <= 1024) targetHeightPx = 110; // Tablet
        if (width <= 650) targetHeightPx = 80; // Mobile
        
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
    }

    render() {
        const delta = this.clock.getDelta();
        this.animateProceduralWings(delta);
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
window.AngelRenderer = AngelRenderer;
