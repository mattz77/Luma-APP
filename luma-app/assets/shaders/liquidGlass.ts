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
    float3 color = float3(0.0);

    float2 q = float2(0.);
    q.x = fbm( st + 0.00*time);
    q.y = fbm( st + float2(1.0));

    float2 r = float2(0.);
    r.x = fbm( st + 1.0*q + float2(1.7,9.2)+ 0.15*time );
    r.y = fbm( st + 1.0*q + float2(8.3,2.8)+ 0.126*time);

    float f = fbm(st+r);

    // Mistura de cores estilo iOS 26 (Cianos, Roxos, Brancos sutis)
    color = mix(float3(0.1, 0.619, 0.667), float3(0.666, 0.666, 0.498), clamp((f*f)*4.0,0.0,1.0));
    color = mix(color, float3(0.0, 0.0, 0.164706), clamp(length(q),0.0,1.0));
    color = mix(color, float3(0.66667, 1.0, 1.0), clamp(length(r.x),0.0,1.0));

    // Adiciona um brilho especular "líquido" baseado na interação de toque (opcional)
    float dist = distance(st, touch / resolution.xy);
    float glow = 1.0 - smoothstep(0.0, 0.3, dist);
    color += float3(glow * 0.2);

    return half4((f*f*f+.6*f*f+.5*f)*color, 1.0);
}
`;
