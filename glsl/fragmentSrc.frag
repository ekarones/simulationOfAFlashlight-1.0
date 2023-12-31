#version 300 es

precision highp float;

in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_position;

out vec4 color;

struct Light{
	vec3 ambient;
	float cutOff;
	vec3 direction;
	vec3 position;
};

uniform vec3 diffuse;
uniform vec3 ambient;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
uniform sampler2D diffuseMap;
uniform sampler2D specularMap;

//uniform vec3 u_ambientLight;
//uniform vec3 u_lightPosition;
uniform vec3 u_viewPosition;//nuestra posicion
uniform Light u_light;

void main() {
	vec3 normal = normalize(v_normal);
	vec4 mapColor = texture(diffuseMap, v_texcoord);
	vec4 mapSpec = texture(specularMap, v_texcoord);
	vec3 lightDir = normalize(u_light.position - v_position);

	//ambient light
	vec3 ambientLight = u_light.ambient * ambient * mapColor.rgb;
	float theta = dot(lightDir, normalize(-u_light.direction));
	
	//difusa
	if(theta > u_light.cutOff){
		float diffuseFactor = max(dot(normal, lightDir), 0.0);
		vec3 diffuseLight = diffuseFactor*diffuse*mapColor.rgb;

		//especular
		vec3 viewDir = normalize(u_viewPosition - v_position);
		vec3 reflectDir = reflect(-lightDir, normal);
		float specularFactor = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
		vec3 specularLight = specularFactor * specular * mapSpec.rgb;

		vec3 result = ambientLight + diffuseLight + specularLight;
		color = vec4(result, opacity);
	}
	else {
		color = vec4(ambientLight, opacity);
	}
	
}