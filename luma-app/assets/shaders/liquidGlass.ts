
export const liquidGlassShader = `
uniform float2 resolution;
uniform float time;
uniform float2 touch;

// Função de ruído pseudo-aleatório
float random (in float2 _st) {
    return fract(sin(dot(_st.xy, float2(12.9898,78.233))) * 43758.5453123);
}

// Noise function para movimento orgânico
float noise (in float2 _st) {
    float2 i = floor(_st);
    float2 f = fract(_st);
    float a = random(i);
    float b = random(i + float2(1.0, 0.0));
    float c = random(i + float2(0.0, 1.0));
    float d = random(i + float2(1.0, 1.0));
    float2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm ( in float2 _st) {
    float v = 0.0;
    float a = 0.5;
    float2 shift = float2(100.0);
    // Rotacionar para reduzir artefatos axiais
    float2x2 rot = float2x2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 5; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

half4 main(float2 xy) {
    float2 st = xy/resolution.xy;
    
    // FBM para criar a textura líquida
    float2 q = float2(0.);
    q.x = fbm( st + 0.00*time);
    q.y = fbm( st + float2(1.0));

    float2 r = float2(0.);
    r.x = fbm( st + 1.0*q + float2(1.7,9.2)+ 0.15*time );
    r.y = fbm( st + 1.0*q + float2(8.3,2.8)+ 0.126*time);

    float f = fbm(st+r);

    // Cor base quase inexistente (transparente)
    float3 color = float3(1.0, 1.0, 1.0);

    // Brilho Especular (Highlights)
    // Onde 'f' é alto, temos "cristas" da onda líquida -> mais branco
    float specular = smoothstep(0.4, 0.9, f*f);
    
    // Interação de toque (brilho localizado)
    float dist = distance(st, touch / resolution.xy);
    float touchGlow = (1.0 - smoothstep(0.0, 0.4, dist)) * 0.3;

    // Alpha Calculation
    // Mantemos o alpha muito baixo (0.15) na base para ver o fundo borrado
    // Aumentamos o alpha apenas onde há brilho especular (efeito molhado)
    float alpha = 0.05 + (specular * 0.25) + touchGlow;

    // Ajuste final de cor: Branco puro nos brilhos
    return half4(color, clamp(alpha, 0.0, 0.4)); 
}
`;
