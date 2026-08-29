import { useEffect, useRef } from "react";
import * as THREE from "three";

export const ThreeBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x07061a, 1);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.z = 110;

    // Golden & amber stardust particle field
    const particleCount = 1400;
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 550;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 550;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 450;

      const t = Math.random();
      col[i * 3] = 0.85 + t * 0.15; // R
      col[i * 3 + 1] = 0.55 + t * 0.35; // G
      col[i * 3 + 2] = t * 0.12; // B
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.95,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // Orbital Gold Rings
    const createRing = (radius: number, thickness: number, opacity: number, rx: number, ry: number, rz: number) => {
      const geo = new THREE.TorusGeometry(radius, thickness, 8, 120);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xd4af37,
        transparent: true,
        opacity,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.set(rx, ry, rz);
      scene.add(mesh);
      return mesh;
    };

    const ring1 = createRing(55, 0.22, 0.12, Math.PI / 4, 0, 0);
    const ring2 = createRing(84, 0.16, 0.07, -Math.PI / 6, Math.PI / 5, 0);
    const ring3 = createRing(36, 0.14, 0.09, Math.PI / 2.5, Math.PI / 6, 0);

    // Wireframe Sacred Geometry Core (Icosahedron)
    const icoGeo = new THREE.IcosahedronGeometry(28, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.04,
      wireframe: true,
    });
    const icoMesh = new THREE.Mesh(icoGeo, icoMat);
    scene.add(icoMesh);

    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      points.rotation.y = time * 0.025;
      points.rotation.x = time * 0.012;

      ring1.rotation.z = time * 0.05;
      ring2.rotation.y = time * 0.035;
      ring3.rotation.z = -time * 0.06;

      icoMesh.rotation.x = time * 0.04;
      icoMesh.rotation.y = time * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      if (el && el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
      pGeo.dispose();
      pMat.dispose();
      icoGeo.dispose();
      icoMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="three-background-canvas"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
};
