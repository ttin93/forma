'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, ContactShadows, Html } from '@react-three/drei';
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HouseWalls { front: boolean; back: boolean; left: boolean; right: boolean }
export interface AdditionalPost { enabled: boolean; offset: number } // cm
export type EnclosureType = 'none' | 'zip-screen' | 'movable-slats' | 'sliding-glass' | 'fixed-glass' | 'ventilation-panel' | 'metal-panel'
export interface EnclosureSegment { type: EnclosureType; colorHex: string }
export type SideEnclosureEntry = [EnclosureSegment, EnclosureSegment]

export interface PergolaConfig {
  width: number; depth: number; height: number;           // cm
  structureColor: string;                                  // hex
  slatsColor: string;                                      // hex
  slatsType: 'flat' | 'wavy';
  lamelleAngle: number;                                    // degrees 0–90
  houseWalls: HouseWalls;
  additionalPosts: {
    front: AdditionalPost; rear: AdditionalPost;
    left:  AdditionalPost; right: AdditionalPost;
  };
  sideEnclosures: {
    front: SideEnclosureEntry; back: SideEnclosureEntry;
    left:  SideEnclosureEntry; right: SideEnclosureEntry;
  };
}

export const ENCLOSURE_TYPES: EnclosureType[] = [
  'none', 'zip-screen', 'movable-slats', 'sliding-glass', 'fixed-glass', 'ventilation-panel', 'metal-panel',
];

export function defaultPergolaConfig(): PergolaConfig {
  const seg = (): EnclosureSegment => ({ type: 'none', colorHex: '#383E42' });
  const side = (): SideEnclosureEntry => [seg(), seg()];
  const post = (): AdditionalPost => ({ enabled: false, offset: 0 });
  return {
    width: 400, depth: 300, height: 250,
    structureColor: '#383E42', slatsColor: '#383E42',
    slatsType: 'flat', lamelleAngle: 0,
    houseWalls: { front: false, back: false, left: false, right: false },
    additionalPosts: { front: post(), rear: post(), left: post(), right: post() },
    sideEnclosures: { front: side(), back: side(), left: side(), right: side() },
  };
}

// ── Constants (meters) ────────────────────────────────────────────────────────

const POST_W    = 0.120
const BASE_W    = 0.200
const BASE_H    = 0.012
const BEAM_H    = 0.200
const BEAM_W    = 0.120
const OVERHANG  = 0.050
const PROFILE   = 0.100
const SLAT_T    = 0.008
const SPACING   = 0.092
const AMPLITUDE = 0.018
const FRAME_W   = 0.04
const FRAME_T   = 0.035

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }

// ── Posts ─────────────────────────────────────────────────────────────────────

function Post({ position, height, color }: { position: [number, number, number]; height: number; color: string }) {
  const shaftH = height - BEAM_H - BASE_H;
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, metalness: 0.75, roughness: 0.25 }), [color]);
  return (
    <group position={position}>
      <mesh position={[0, BASE_H / 2, 0]} receiveShadow castShadow material={mat}>
        <boxGeometry args={[BASE_W, BASE_H, BASE_W]} />
      </mesh>
      <mesh position={[0, BASE_H + shaftH / 2, 0]} castShadow receiveShadow material={mat}>
        <boxGeometry args={[POST_W, shaftH, POST_W]} />
      </mesh>
    </group>
  );
}

function PostsGroup({ cfg }: { cfg: PergolaConfig }) {
  const W = cfg.width / 100; const L = cfg.depth / 100; const H = cfg.height / 100;
  const hW = W / 2; const hL = L / 2;
  const { houseWalls: hw, additionalPosts: ap } = cfg;

  const posts = useMemo<[number, number, number][]>(() => {
    const pts: [number, number, number][] = [];
    ([[-hW, 0, -hL], [hW, 0, -hL], [-hW, 0, hL], [hW, 0, hL]] as [number, number, number][]).forEach(([x, y, z]) => {
      const wallZ = Math.abs(z - (-hL)) < 0.01 ? hw.back : hw.front;
      const wallX = Math.abs(x - (-hW)) < 0.01 ? hw.left : hw.right;
      if (wallZ || wallX) return;
      pts.push([x, y, z]);
    });
    if (ap.front.enabled && !hw.front) pts.push([clamp(ap.front.offset / 100, -hW + 0.3, hW - 0.3), 0,  hL]);
    if (ap.rear.enabled  && !hw.back)  pts.push([clamp(ap.rear.offset  / 100, -hW + 0.3, hW - 0.3), 0, -hL]);
    if (ap.left.enabled  && !hw.left)  pts.push([-hW, 0, clamp(ap.left.offset  / 100, -hL + 0.3, hL - 0.3)]);
    if (ap.right.enabled && !hw.right) pts.push([ hW, 0, clamp(ap.right.offset / 100, -hL + 0.3, hL - 0.3)]);
    return pts;
  }, [W, L, hw, ap, hW, hL]);

  return (
    <group>
      {posts.map((pos, i) => <Post key={i} position={pos} height={H} color={cfg.structureColor} />)}
    </group>
  );
}

// ── Roof beams ────────────────────────────────────────────────────────────────

function RoofBeamsGroup({ cfg }: { cfg: PergolaConfig }) {
  const W = cfg.width / 100; const L = cfg.depth / 100; const H = cfg.height / 100;
  const y = H - BEAM_H / 2;
  const sW = W + OVERHANG * 2; const sL = L + OVERHANG * 2;
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: cfg.structureColor, metalness: 0.75, roughness: 0.22 }), [cfg.structureColor]);
  const pur = useMemo(() => new THREE.MeshStandardMaterial({ color: cfg.structureColor, metalness: 0.70, roughness: 0.26 }), [cfg.structureColor]);
  return (
    <group>
      <mesh position={[0, y,  L/2]} castShadow receiveShadow material={mat}><boxGeometry args={[sW, BEAM_H, BEAM_W]} /></mesh>
      <mesh position={[0, y, -L/2]} castShadow receiveShadow material={mat}><boxGeometry args={[sW, BEAM_H, BEAM_W]} /></mesh>
      <mesh position={[-W/2, y, 0]} castShadow receiveShadow material={mat}><boxGeometry args={[BEAM_W, BEAM_H, sL]} /></mesh>
      <mesh position={[ W/2, y, 0]} castShadow receiveShadow material={mat}><boxGeometry args={[BEAM_W, BEAM_H, sL]} /></mesh>
      {[-W/3, 0, W/3].map((x, i) => (
        <mesh key={i} position={[x, y - BEAM_H * 0.30, 0]} castShadow receiveShadow material={pur}>
          <boxGeometry args={[BEAM_W * 0.55, BEAM_H * 0.50, sL - 0.01]} />
        </mesh>
      ))}
    </group>
  );
}

// ── Louvers ───────────────────────────────────────────────────────────────────

function buildWavyGeo(W: number): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(W, PROFILE, 4, 40);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getZ(i) + PROFILE / 2) / PROFILE;
    pos.setY(i, AMPLITUDE * Math.sin(t * Math.PI));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function LouversGroup({ cfg }: { cfg: PergolaConfig }) {
  const W = cfg.width / 100; const L = cfg.depth / 100; const H = cfg.height / 100;
  const tilt = (cfg.lamelleAngle * Math.PI) / 180;
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: cfg.slatsColor, metalness: 0.70, roughness: 0.25, side: THREE.DoubleSide,
  }), [cfg.slatsColor]);
  const wavyGeo = useMemo(() => buildWavyGeo(W), [W]);
  const flatGeo = useMemo(() => new THREE.BoxGeometry(W, SLAT_T, PROFILE), [W]);
  const geo = cfg.slatsType === 'wavy' ? wavyGeo : flatGeo;
  const count = Math.max(2, Math.ceil(L / SPACING));
  const inner = L / 2 - PROFILE / 2;
  const step  = count > 1 ? (inner * 2) / (count - 1) : 0;
  const y = H - SLAT_T / 2 - 0.003;
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} geometry={geo} material={mat}
          position={[0, y, -inner + i * step]}
          rotation={[tilt, 0, 0]}
          castShadow receiveShadow frustumCulled={false} />
      ))}
    </group>
  );
}

// ── Wall attachment ───────────────────────────────────────────────────────────

const _wallMat    = new THREE.MeshStandardMaterial({ color: '#c8c4ba', roughness: 0.9, metalness: 0 });
const _bracketMat = new THREE.MeshStandardMaterial({ color: '#4a4a4a', metalness: 0.8, roughness: 0.3 });
const WALL_T = 0.35; const WALL_E = 0.7;

function WallAttachmentGroup({ cfg }: { cfg: PergolaConfig }) {
  const W = cfg.width / 100; const L = cfg.depth / 100; const H = cfg.height / 100;
  const hW = W / 2; const hL = L / 2;
  const { houseWalls: hw } = cfg;
  const wallH = H + 0.35;
  type WallDef = { key: keyof HouseWalls; pos: [number,number,number]; size: [number,number,number] };
  const walls: WallDef[] = [
    { key: 'back',  pos: [0, wallH/2, -hL - WALL_T/2], size: [W + WALL_E*2, wallH, WALL_T] },
    { key: 'front', pos: [0, wallH/2,  hL + WALL_T/2], size: [W + WALL_E*2, wallH, WALL_T] },
    { key: 'left',  pos: [-hW - WALL_T/2, wallH/2, 0], size: [WALL_T, wallH, L + WALL_E*2] },
    { key: 'right', pos: [ hW + WALL_T/2, wallH/2, 0], size: [WALL_T, wallH, L + WALL_E*2] },
  ];
  return (
    <group name="wall-attachment">
      {walls.map(({ key, pos, size }) => hw[key] ? (
        <mesh key={key} position={pos} castShadow receiveShadow material={_wallMat}>
          <boxGeometry args={size} />
        </mesh>
      ) : null)}
      {hw.back  && [-W/3, 0, W/3].map((x, i) => <mesh key={`bb${i}`} position={[x, H-0.08, -hL-0.01]} material={_bracketMat}><boxGeometry args={[0.06,0.18,0.08]} /></mesh>)}
      {hw.front && [-W/3, 0, W/3].map((x, i) => <mesh key={`bf${i}`} position={[x, H-0.08,  hL+0.01]} material={_bracketMat}><boxGeometry args={[0.06,0.18,0.08]} /></mesh>)}
      {hw.left  && [-L/3, 0, L/3].map((z, i) => <mesh key={`bl${i}`} position={[-hW-0.01, H-0.08, z]} material={_bracketMat}><boxGeometry args={[0.08,0.18,0.06]} /></mesh>)}
      {hw.right && [-L/3, 0, L/3].map((z, i) => <mesh key={`br${i}`} position={[ hW+0.01, H-0.08, z]} material={_bracketMat}><boxGeometry args={[0.08,0.18,0.06]} /></mesh>)}
    </group>
  );
}

// ── Side enclosure panels ─────────────────────────────────────────────────────

function ZipScreen({ w, h, color }: { w: number; h: number; color: string }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.62, side: THREE.DoubleSide, roughness: 0.85 }), [color]);
  const frm = useMemo(() => new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.4 }), [color]);
  return (
    <group>
      <mesh material={mat} castShadow><planeGeometry args={[w - FRAME_W*2, h - FRAME_W*2, 4, 12]} /></mesh>
      <mesh position={[0,  h/2-FRAME_W/2, 0]} material={frm}><boxGeometry args={[w, FRAME_W, FRAME_T]} /></mesh>
      <mesh position={[0, -h/2+FRAME_W/2, 0]} material={frm}><boxGeometry args={[w, FRAME_W, FRAME_T]} /></mesh>
      <mesh position={[ w/2-FRAME_W/2, 0, 0]} material={frm}><boxGeometry args={[FRAME_W, h, FRAME_T]} /></mesh>
      <mesh position={[-w/2+FRAME_W/2, 0, 0]} material={frm}><boxGeometry args={[FRAME_W, h, FRAME_T]} /></mesh>
    </group>
  );
}

function MovableSlats({ w, h, color }: { w: number; h: number; color: string }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.35 }), [color]);
  const n = Math.max(4, Math.round(w / 0.11)); const sw = w / n;
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[sw*i - w/2 + sw/2, 0, 0]} material={mat} castShadow>
          <boxGeometry args={[sw * 0.88, h, 0.022]} />
        </mesh>
      ))}
    </group>
  );
}

function SlidingGlass({ w, h, color, fixed = false }: { w: number; h: number; color: string; fixed?: boolean }) {
  const panels = fixed ? 2 : Math.max(2, Math.round(w / 1.2)); const pw = w / panels;
  const frm = useMemo(() => new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.2 }), [color]);
  const gls = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#88aacc', transmission: 0.88, roughness: 0.04, metalness: 0.08,
    transparent: true, opacity: 0.35, side: THREE.DoubleSide,
  }), []);
  return (
    <group>
      {Array.from({ length: panels }, (_, i) => {
        const x = -w/2 + pw*(i+0.5);
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh material={gls} castShadow><boxGeometry args={[pw-FRAME_W*2, h-FRAME_W*2, FRAME_T*0.3]} /></mesh>
            <mesh position={[0,  h/2-FRAME_W/2, 0]} material={frm}><boxGeometry args={[pw, FRAME_W, FRAME_T]} /></mesh>
            <mesh position={[0, -h/2+FRAME_W/2, 0]} material={frm}><boxGeometry args={[pw, FRAME_W, FRAME_T]} /></mesh>
            <mesh position={[ pw/2-FRAME_W/2, 0, 0]} material={frm}><boxGeometry args={[FRAME_W, h, FRAME_T]} /></mesh>
            <mesh position={[-pw/2+FRAME_W/2, 0, 0]} material={frm}><boxGeometry args={[FRAME_W, h, FRAME_T]} /></mesh>
          </group>
        );
      })}
    </group>
  );
}

function VentilationPanel({ w, h, color }: { w: number; h: number; color: string }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.3 }), [color]);
  const rows = Math.max(4, Math.round(h / 0.07)); const sh = h / rows;
  return (
    <group>
      {Array.from({ length: rows }, (_, i) => (
        <mesh key={i} position={[0, h/2-sh*(i+0.5), 0.015]} material={mat} castShadow>
          <boxGeometry args={[w-FRAME_W*2, sh*0.7, 0.018]} />
        </mesh>
      ))}
      <mesh position={[0,  h/2-FRAME_W/2, 0]} material={mat}><boxGeometry args={[w, FRAME_W, FRAME_T]} /></mesh>
      <mesh position={[0, -h/2+FRAME_W/2, 0]} material={mat}><boxGeometry args={[w, FRAME_W, FRAME_T]} /></mesh>
      <mesh position={[ w/2-FRAME_W/2, 0, 0]} material={mat}><boxGeometry args={[FRAME_W, h, FRAME_T]} /></mesh>
      <mesh position={[-w/2+FRAME_W/2, 0, 0]} material={mat}><boxGeometry args={[FRAME_W, h, FRAME_T]} /></mesh>
    </group>
  );
}

function MetalPanel({ w, h, color }: { w: number; h: number; color: string }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, metalness: 0.75, roughness: 0.25 }), [color]);
  const frm = useMemo(() => new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness: 0.15 }), [color]);
  const rev = Math.max(3, Math.round(h / 0.18)); const rh = h / rev;
  return (
    <group>
      {Array.from({ length: rev }, (_, i) => (
        <mesh key={i} position={[0, h/2-rh*(i+0.5), 0]} material={mat} castShadow>
          <boxGeometry args={[w, rh-0.006, 0.032]} />
        </mesh>
      ))}
      <mesh position={[ w/2-FRAME_W/2, 0, 0.038]} material={frm}><boxGeometry args={[FRAME_W, h, FRAME_T]} /></mesh>
      <mesh position={[-w/2+FRAME_W/2, 0, 0.038]} material={frm}><boxGeometry args={[FRAME_W, h, FRAME_T]} /></mesh>
    </group>
  );
}

function EnclosurePanel({ type, w, h, color }: { type: EnclosureType; w: number; h: number; color: string }) {
  if (type === 'none') return null;
  if (type === 'zip-screen')        return <ZipScreen w={w} h={h} color={color} />;
  if (type === 'movable-slats')     return <MovableSlats w={w} h={h} color={color} />;
  if (type === 'sliding-glass')     return <SlidingGlass w={w} h={h} color={color} />;
  if (type === 'fixed-glass')       return <SlidingGlass w={w} h={h} color={color} fixed />;
  if (type === 'ventilation-panel') return <VentilationPanel w={w} h={h} color={color} />;
  if (type === 'metal-panel')       return <MetalPanel w={w} h={h} color={color} />;
  return null;
}

type EncSide = 'front' | 'back' | 'left' | 'right';
const POST_KEY: Record<EncSide, 'front' | 'rear' | 'left' | 'right'> = { front: 'front', back: 'rear', left: 'left', right: 'right' };

function SideEnclosureGroup({ cfg }: { cfg: PergolaConfig }) {
  const W = cfg.width / 100; const L = cfg.depth / 100; const H = cfg.height / 100;
  const hW = W/2; const hL = L/2;
  const panelH = H - BEAM_H;

  return (
    <group>
      {(['front','back','left','right'] as EncSide[]).map(side => {
        if (cfg.houseWalls[side]) return null;
        const post = cfg.additionalPosts[POST_KEY[side]];
        const po = post.offset / 100;
        let segs: { posX: number; posZ: number; spanX: number; rotY: number }[];

        if (side === 'front' || side === 'back') {
          const posZ = side === 'front' ? hL : -hL;
          const rotY = side === 'back' ? Math.PI : 0;
          if (!post.enabled) {
            segs = [{ posX: 0, posZ, spanX: W, rotY }];
          } else {
            const px = clamp(po, -hW+0.15, hW-0.15);
            segs = [
              { posX: (-hW+px)/2, posZ, spanX: px+hW, rotY },
              { posX: (px+hW)/2,  posZ, spanX: hW-px, rotY },
            ];
          }
        } else {
          const posX = side === 'right' ? hW : -hW;
          const rotY = side === 'right' ? Math.PI/2 : -Math.PI/2;
          if (!post.enabled) {
            segs = [{ posX, posZ: 0, spanX: L, rotY }];
          } else {
            const pz = clamp(po, -hL+0.15, hL-0.15);
            segs = [
              { posX, posZ: (-hL+pz)/2, spanX: pz+hL, rotY },
              { posX, posZ: (pz+hL)/2,  spanX: hL-pz, rotY },
            ];
          }
        }

        return segs.map((seg, si) => {
          const segment = cfg.sideEnclosures[side][si];
          if (!segment || segment.type === 'none') return null;
          return (
            <group key={`${side}-${si}`} position={[seg.posX, panelH/2, seg.posZ]} rotation={[0, seg.rotY, 0]}>
              <EnclosurePanel type={segment.type} w={seg.spanX} h={panelH} color={segment.colorHex} />
            </group>
          );
        });
      })}
    </group>
  );
}

// ── Dimension labels ──────────────────────────────────────────────────────────

function DimLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.95)', border: '1px solid #ccc', borderRadius: 4,
      padding: '2px 8px', fontSize: 10, fontFamily: 'ui-monospace,monospace', color: '#1a1a1a',
      whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none',
      boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
    }}>{children}</div>
  );
}

function GroundLabel({ text, sub }: { text: string; sub: string }) {
  return (
    <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#888', pointerEvents: 'none', userSelect: 'none', textAlign: 'center', lineHeight: 1.4 }}>
      {text}<br /><span style={{ fontSize: 8, opacity: 0.55 }}>{sub}</span>
    </div>
  );
}

function DimensionsGroup({ cfg }: { cfg: PergolaConfig }) {
  const W = cfg.width/100; const L = cfg.depth/100; const H = cfg.height/100;
  const hW = W/2; const hL = L/2; const roofY = H - BEAM_H/2;
  return (
    <group>
      <Html position={[-(hW+0.55), H/2, hL]} center occlude={false} zIndexRange={[20,0]}>
        <DimLabel>V: {cfg.height} cm</DimLabel>
      </Html>
      <Html position={[0, roofY+0.28, hL+0.4]} center occlude={false} zIndexRange={[20,0]}>
        <DimLabel>Š: {cfg.width} cm</DimLabel>
      </Html>
      <Html position={[hW+0.55, roofY+0.22, 0]} center occlude={false} zIndexRange={[20,0]}>
        <DimLabel>D: {cfg.depth} cm</DimLabel>
      </Html>
      <Html position={[0, 0.01, hL+0.32]} center occlude={false} zIndexRange={[20,0]}>
        <GroundLabel text="SPREDAJ" sub="DOLŽINA" />
      </Html>
      <Html position={[hW+0.28, 0.01, 0]} center occlude={false} zIndexRange={[20,0]}>
        <GroundLabel text="DESNO" sub="ŠIRINA" />
      </Html>
    </group>
  );
}

// ── AR/GLB exporter ───────────────────────────────────────────────────────────

function SceneExporter({ exportRef }: { exportRef: React.MutableRefObject<(() => Promise<Blob>) | null> }) {
  const { scene } = useThree();
  useEffect(() => {
    exportRef.current = async () => {
      const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
      const exporter = new GLTFExporter();
      const target = scene.getObjectByName('pergola-structure') ?? scene;
      const result = await exporter.parseAsync(target, { binary: true }) as ArrayBuffer;
      return new Blob([result], { type: 'model/gltf-binary' });
    };
    return () => { exportRef.current = null; };
  }, [scene, exportRef]);
  return null;
}

// ── Scene ─────────────────────────────────────────────────────────────────────

function PergolaScene({ cfg }: { cfg: PergolaConfig }) {
  const W = cfg.width/100; const L = cfg.depth/100;
  const size = Math.max(W, L, cfg.height/100);
  return (
    <group name="pergola-model">
      <group name="pergola-structure">
        <WallAttachmentGroup cfg={cfg} />
        <PostsGroup cfg={cfg} />
        <RoofBeamsGroup cfg={cfg} />
        <LouversGroup cfg={cfg} />
        <SideEnclosureGroup cfg={cfg} />
      </group>
      <DimensionsGroup cfg={cfg} />
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[size*10, size*10]} />
        <meshStandardMaterial color="#e0e4e0" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function Pergola3D({ cfg, style, exportRef }: {
  cfg: PergolaConfig;
  style?: React.CSSProperties;
  exportRef?: React.MutableRefObject<(() => Promise<Blob>) | null>;
}) {
  const W = cfg.width/100; const L = cfg.depth/100; const H = cfg.height/100;
  const size = Math.max(W, L, H);
  const cam = size * 2.2;
  return (
    <Canvas
      shadows
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      style={{ background: 'linear-gradient(175deg,#e8edf2 0%,#d6dde6 100%)', width: '100%', height: '100%', ...style }}
    >
      <PerspectiveCamera makeDefault position={[cam*0.95, size*1.3, cam*0.85]} fov={36} />
      <OrbitControls enablePan={false} target={[0, H*0.45, 0]}
        minPolarAngle={0.1} maxPolarAngle={Math.PI/2.05}
        minDistance={size*1.0} maxDistance={size*5.5} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[7,11,5]} intensity={1.6} castShadow
        shadow-mapSize={[2048,2048]}
        shadow-camera-left={-12} shadow-camera-right={12}
        shadow-camera-top={12} shadow-camera-bottom={-12} shadow-camera-far={50} />
      <directionalLight position={[-4,5,-4]} intensity={0.3} />
      <ContactShadows position={[0,0.001,0]} opacity={0.3} scale={size*6} blur={2.5} far={H+1} color="#9aabb5" />
      {exportRef && <SceneExporter exportRef={exportRef} />}
      <PergolaScene cfg={cfg} />
    </Canvas>
  );
}
