import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows } from '@react-three/drei';

function FileModel({ cleaning }) {
    const meshRef = useRef();

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * (cleaning ? 3 : 0.5);
            if (cleaning) {
                meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 5) * 0.2;
            }
        }
    });

    return (
        <mesh ref={meshRef}>
            <boxGeometry args={[1.5, 2, 0.4]} />
            <meshStandardMaterial
                color={cleaning ? '#00F5A0' : '#FF3B5C'}
                roughness={0.2}
                metalness={0.8}
                envMapIntensity={2}
            />
        </mesh>
    );
}

export default function ThreeDFileIcon({ cleaning = false, className = "h-64 w-full" }) {
    return (
        <div className={className}>
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <hemisphereLight groundColor="#080808" intensity={0.85} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-4, 3, 4]} intensity={12} color="#00F5A0" />
                <pointLight position={[4, -2, 4]} intensity={10} color="#FF3B5C" />
                <Float speed={2} rotationIntensity={0.5} floatIntensity={2}>
                    <FileModel cleaning={cleaning} />
                </Float>
                <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} />
            </Canvas>
        </div>
    );
}
