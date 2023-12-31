#version 300 es

in vec2 a_texcoord;//coorderdanas de la texturas
in vec3 a_normal;
in vec4 a_position;
// in vec4 a_color;

out vec3 v_position;
out vec2 v_texcoord;
out vec3 v_normal;
// out vec4 v_color;

uniform mat4 u_world;
uniform mat4 u_view;
uniform mat4 u_projection;

void main() {
    gl_Position = u_projection * u_view * u_world * a_position;
    v_texcoord = a_texcoord;
    v_normal = mat3(u_world) * a_normal;
    v_position=(u_world*a_position).xyz;
    // v_color = a_color;
}