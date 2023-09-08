import { useCallback, useEffect, useRef, useState } from "react";

type MeanStandardDeviation = {
  mean: number; // 평균값
  dev: number; // 표준편차
};

function randomNormal(objectPool: MeanStandardDeviation) {
  const { mean, dev } = objectPool;
  let r, a, n, e;

  // Box-Muller 변환을 사용하여 난수 생성
  do {
    r = (a = 2 * Math.random() - 1) * a + (n = 2 * Math.random() - 1) * n;
  } while (r >= 1);

  e = a * Math.sqrt((-2 * Math.log(r)) / r);

  // 정규 분포에 평균과 표준편차를 적용하여 반환
  return dev * e + mean;
}

// 범위 내에서 난수 생성 함수
function rand(low: number, high: number) {
  return Math.random() * (high - low) + low;
}

type Size = {
  width: number;
  height: number;
};

class Particle {
  // 파티클 속성
  color: { r: number; g: number; b: number; a: number };
  position: { x: number; y: number };
  diameter: number;
  duration: number;
  amplitude: number;
  offsetY: number;
  arc: number;
  startTime: number;
  constructor() {
    // 파티클 초기화
    this.color = {
      r: 100,
      g: 100,
      b: randomNormal({ mean: 125, dev: 20 }),
      a: rand(0, 1),
    };
    this.position = { x: -2, y: -2 };
    this.diameter = Math.max(
      0,
      randomNormal({ mean: PARTICLE_SIZE, dev: PARTICLE_SIZE / 2 })
    );
    this.duration = randomNormal({ mean: SPEED, dev: SPEED * 0.1 });
    this.amplitude = randomNormal({ mean: 16, dev: 2 });
    this.offsetY = randomNormal({ mean: 0, dev: 10 });
    this.arc = Math.PI * 2; // 꺽임 횟수
    this.startTime = performance.now() - rand(0, SPEED);
  }
}

const PARTICLE_SIZE = 0.5; // 파티클 크기
const SPEED = 20000; // 밀리세컨드

const particles: Particle[] = [];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const NUM_PARTICLES = Math.round(600 * ((size.width + size.height) / 3000)); // 파티클 개수

  // 캔버스 크기 조절 및 초기화
  useEffect(() => {
    //context 처리
    handleResize();
    if (!canvasRef.current) return;
    const canvas: HTMLCanvasElement = canvasRef.current!;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    setCtx(context);
    while (particles.length < NUM_PARTICLES) {
      particles.push(new Particle());
    }
    while (particles.length > NUM_PARTICLES) {
      particles.pop();
    }
  }, [NUM_PARTICLES]);

  // 화면 리사이즈 이벤트 핸들러
  const handleResize = () => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };
  useEffect(() => {
    // 화면 resize 처리
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  // 애니메이션 프레임 요청 및 해제
  useEffect(() => {
    let requestId: number;
    const RequestAnimation = (ctx: CanvasRenderingContext2D | null) => (time: number) => {
      if (ctx) {
        animate(ctx, time);
      }
      // 애니메이션 콜백 반복
      requestId = window.requestAnimationFrame(RequestAnimation(ctx));
    };

    // 애니메이션 초기화
    requestId = window.requestAnimationFrame(RequestAnimation(ctx));
    return () => {
      window.cancelAnimationFrame(requestId);
    };
  });

  // 애니메이션 로직
  const animate = useCallback(
    (ctx: CanvasRenderingContext2D, time: number) => {
      ctx.clearRect(0, 0, size.width, size.height);
      const vh = size.height / 100;
      particles.forEach((particle, index) => {
        ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.color.a})`;
        ctx.beginPath();
        ctx.ellipse(
          particle.position.x * size.width,
          particle.position.y * vh + size.height / 2,
          particle.diameter * vh,
          particle.diameter * vh,
          0,
          0,
          2 * Math.PI
        );
        ctx.fill();

        const progress =
          ((time - particle.startTime) % particle.duration) / particle.duration;
        particles[index].position = {
          x: progress,
          y: Math.sin(progress * particle.arc) * particle.amplitude + particle.offsetY,
        };
      });
    },
    [size.height, size.width]
  );

  return <canvas ref={canvasRef} width={size.width} height={size.height}></canvas>;
}
