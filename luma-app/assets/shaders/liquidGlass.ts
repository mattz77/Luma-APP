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

    // Mistura de cores estilo iOS 26 Pearl/Holographic Glass (Ajustado para Contraste)
    
    // Base mais neutra, mas não branco puro, para permitir luz/sombra
    float3 colorBase = float3(0.92, 0.94, 0.96); 
    
    // Cores de refração mais saturadas para serem visíveis através do Blur
    float3 colorCyan = float3(0.40, 0.75, 0.95);   // Ciano vibrante
    float3 colorPurple = float3(0.70, 0.60, 0.90); // Roxo suave
    float3 colorDeep = float3(0.85, 0.90, 0.95);   // Sombra leve

    // Mix baseado no noise (f)
    // Camada 1: Base vs Ciano
    color = mix(colorBase, colorCyan, clamp((f*f)*3.5, 0.0, 1.0));
    
    // Camada 2: Adiciona Roxo nas áreas de distorção (q)
    color = mix(color, colorPurple, clamp(length(q), 0.0, 0.8));
    
    // Camada 3: Adiciona profundidade nas áreas secundárias (r)
    color = mix(color, colorDeep, clamp(length(r.x), 0.0, 1.0));

    // Adiciona um brilho especular "líquido" baseado na interação de toque (opcional)
    float dist = distance(st, touch / resolution.xy);
    float glow = 1.0 - smoothstep(0.0, 0.3, dist);
    color += float3(glow * 0.15);

    // Contraste e Brilho
    // Acentua os picos de luz para dar o efeito de vidro molhado
    float3 finalColor = (f*f*f + 0.5*f*f + 0.7*f) * color;
    
    // Garante que não fique escuro demais
    finalColor = min(finalColor + 0.05, 1.0);

    // Alpha 0.45: Equilíbrio entre translucidez e visibilidade da cor
    // Se for muito baixo, o BlurView branco lava tudo. Se for muito alto, fica opaco.
    return half4(finalColor, 0.45);
}
`;
