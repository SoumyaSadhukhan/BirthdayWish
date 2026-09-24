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

        // 1. Head & Neck
        const headGeo = new THREE.SphereGeometry(0.3, 32, 32);
        const skinMat = new THREE.MeshStandardMaterial({
            color: 0xffdbac, // Warm skin tone
            roughness: 0.4,
            metalness: 0.1
        });
        const headMesh = new THREE.Mesh(headGeo, skinMat);
        headMesh.position.y = 1.6;
        angelBodyGroup.add(headMesh);
        
        const neckGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.2, 16);
        const neckMesh = new THREE.Mesh(neckGeo, skinMat);
        neckMesh.position.y = 1.35;
        angelBodyGroup.add(neckMesh);

        // 2. Hair (Long flowing auburn/brunette hair)
        const hairGeo = new THREE.SphereGeometry(0.33, 32, 32);
        const hairMat = new THREE.MeshStandardMaterial({
            color: 0x5c3a21, 
            roughness: 0.7,
            metalness: 0.1
        });
        const hairTop = new THREE.Mesh(hairGeo, hairMat);
        hairTop.position.set(0, 1.63, -0.06);
        angelBodyGroup.add(hairTop);

        // Flowing back hair
        const hairBackShape = new THREE.Shape();
        hairBackShape.moveTo(0, 0);
        hairBackShape.quadraticCurveTo(0.5, -0.6, 0.6, -1.4);
        hairBackShape.quadraticCurveTo(0, -1.5, -0.6, -1.4);
        hairBackShape.quadraticCurveTo(-0.5, -0.6, 0, 0);
        
        const hairBackGeo = new THREE.ExtrudeGeometry(hairBackShape, { depth: 0.15, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 });
        const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
        hairBack.position.set(0, 1.5, -0.25);
        angelBodyGroup.add(hairBack);

        // 3. Golden Crown (Tiara)
        const crownGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.12, 16, 1, true);
        const crownMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 1.0,
            roughness: 0.2,
            emissive: 0xffaa00,
            emissiveIntensity: 0.4,
            side: THREE.DoubleSide
        });
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.set(0, 1.82, 0);
        
        // Crown points
        for(let i=0; i<6; i++) {
            const pointGeo = new THREE.ConeGeometry(0.06, 0.18, 4);
            const point = new THREE.Mesh(pointGeo, crownMat);
            point.position.y = 0.06;
            const angle = (i/6) * Math.PI * 2;
            point.position.x = Math.cos(angle) * 0.25;
            point.position.z = Math.sin(angle) * 0.25;
            point.rotation.x = Math.PI / 16;
            crown.add(point);
        }
        angelBodyGroup.add(crown);

        // 4. Dress / Gown (LatheGeometry for sweeping elegant skirt)
        const points = [];
        for ( let i = 0; i <= 24; i ++ ) {
            const t = i / 24;
            // Sweeping curve: starts thin at waist, flares out wide at bottom
            const x = 0.22 + Math.pow(t, 2.5) * 2.0; 
            const y = 1.3 - (t * 2.5); // From waist y=1.3 down to y=-1.2
            points.push( new THREE.Vector2( x, y ) );
        }
        const dressGeo = new THREE.LatheGeometry( points, 32 );
        const dressMat = new THREE.MeshPhysicalMaterial({
            color: 0x9333ea, // Deep purple
            emissive: 0x6b21a8,
            emissiveIntensity: 0.3,
            roughness: 0.4,
            metalness: 0.1,
            clearcoat: 0.6, // Magical sheen
            clearcoatRoughness: 0.3,
            side: THREE.DoubleSide
        });
        const dressMesh = new THREE.Mesh(dressGeo, dressMat);
        angelBodyGroup.add(dressMesh);

        // Bodice (Upper Dress)
        const bodiceGeo = new THREE.CylinderGeometry(0.28, 0.21, 0.45, 32);
        const bodiceMesh = new THREE.Mesh(bodiceGeo, dressMat);
        bodiceMesh.position.y = 1.08;
        angelBodyGroup.add(bodiceMesh);

        // 5. Arms & Legs
        const armGeo = new THREE.CylinderGeometry(0.045, 0.035, 0.65, 16);
        
        this.rightArmMesh = new THREE.Mesh(armGeo, skinMat);
        this.rightArmMesh.position.set(0.35, 0.85, 0.15);
        this.rightArmMesh.rotation.z = -Math.PI / 6;
        this.rightArmMesh.rotation.x = -Math.PI / 5; // Reaching forward
        angelBodyGroup.add(this.rightArmMesh);

        this.leftArmMesh = new THREE.Mesh(armGeo, skinMat);
        this.leftArmMesh.position.set(-0.35, 0.85, 0.15);
        this.leftArmMesh.rotation.z = Math.PI / 6;
        this.leftArmMesh.rotation.x = -Math.PI / 5;
        angelBodyGroup.add(this.leftArmMesh);
        
        // Legs
        const legGeo = new THREE.CylinderGeometry(0.045, 0.035, 0.7, 16);
        this.rightLegMesh = new THREE.Mesh(legGeo, skinMat);
        this.rightLegMesh.position.set(0.12, 0.0, 0);
        angelBodyGroup.add(this.rightLegMesh);
        
        this.leftLegMesh = new THREE.Mesh(legGeo, skinMat);
        this.leftLegMesh.position.set(-0.12, 0.0, 0);
        angelBodyGroup.add(this.leftLegMesh);

        // Magic Wand in right hand
        const wandGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8);
        const wandMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.2 });
        this.wandMesh = new THREE.Mesh(wandGeo, wandMat);
        this.wandMesh.position.set(0.45, 1.0, 0.4);
        this.wandMesh.rotation.x = Math.PI / 3;
        angelBodyGroup.add(this.wandMesh);

        const starTipGeo = new THREE.OctahedronGeometry(0.12);
        const starTipMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 2.5
        });
        const starTip = new THREE.Mesh(starTipGeo, starTipMat);
        starTip.position.y = 0.4;
        this.wandMesh.add(starTip);

        // 6. 3D Wings System (Majestic Glowing Purple/Pink Wings)
        this.leftWingMesh = new THREE.Group();
        this.leftWingMesh.position.set(-0.15, 1.2, -0.2);

        this.rightWingMesh = new THREE.Group();
        this.rightWingMesh.position.set(0.15, 1.2, -0.2);

        // Butterfly Wing Shape
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        // Upper lobe
        wingShape.bezierCurveTo(-1.0, 1.5, -2.5, 1.8, -3.0, 0.5);
        wingShape.bezierCurveTo(-3.2, -0.2, -2.0, -0.5, -1.0, -0.2);
        // Lower lobe
        wingShape.bezierCurveTo(-2.5, -1.5, -1.5, -2.5, -0.2, -1.0);
        wingShape.bezierCurveTo(-0.2, -0.5, 0, -0.2, 0, 0);

        const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02 });
        
        // Wing Material: Glowing lavender/pink
        const wingMat = new THREE.MeshPhysicalMaterial({
            color: 0xe879f9, // Pinkish purple
            emissive: 0xc084fc, // Glowing purple
            emissiveIntensity: 0.65,
            roughness: 0.2,
            transmission: 0.6, // Glass-like magical transparency
            opacity: 0.85,
            transparent: true,
            side: THREE.DoubleSide
        });

        const leftFeather = new THREE.Mesh(wingGeo, wingMat);
        this.leftWingMesh.add(leftFeather);

        const rightFeather = new THREE.Mesh(wingGeo, wingMat);
        rightFeather.scale.set(-1, 1, 1); // Flip horizontally
        this.rightWingMesh.add(rightFeather);

        angelBodyGroup.add(this.leftWingMesh);
        angelBodyGroup.add(this.rightWingMesh);

        // 7. Sparkle Particles floating around the dress
        const particleGeo = new THREE.BufferGeometry();
        const particleCount = 60;
        const posArray = new Float32Array(particleCount * 3);
        for(let i=0; i<particleCount * 3; i+=3) {
            posArray[i] = (Math.random() - 0.5) * 4;
            posArray[i+1] = (Math.random() - 0.5) * 3;
            posArray[i+2] = (Math.random() - 0.5) * 4;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particleMat = new THREE.PointsMaterial({
            size: 0.06,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const sparkles = new THREE.Points(particleGeo, particleMat);
        sparkles.position.y = 0.0;
        angelBodyGroup.add(sparkles);
        this.sparklesMesh = sparkles;

        this.angelMesh = angelBodyGroup;
        
        // Scale down slightly to fit the expected bounding box logic
        this.angelMesh.scale.set(0.6, 0.6, 0.6);

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
