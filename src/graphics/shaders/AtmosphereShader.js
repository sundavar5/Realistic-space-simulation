export const AtmosphereVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const AtmosphereFragmentShader = `
varying vec3 vNormal;
varying vec3 vPosition;
uniform vec3 color;
uniform vec3 lightPosition;
uniform float intensity;

void main() {
    vec3 lightDir = normalize(lightPosition - vPosition);
    float dotNL = max(dot(vNormal, lightDir), 0.0);

    // Rim lighting (Fresnel-ish)
    vec3 viewDir = normalize(-vPosition);
    float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
    rim = pow(rim, 3.0);

    vec3 finalColor = color * dotNL + color * rim * intensity;
    gl_FragColor = vec4(finalColor, 1.0);
}
`;
