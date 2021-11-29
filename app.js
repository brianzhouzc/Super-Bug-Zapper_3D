/** @type {HTMLCanvasElement} */
let canvas;

/** @type {HTMLCanvasElement} */
let particle_canvas;

/** @type {WebGLRenderingContext} */
let gl;

/** @type {CanvasRenderingContext2D} */
let ctx;

let program, vertex_buffer, color_buffer, index_buffer;
let world, view, proj;
let matWorldUniformLocation, matViewUniformLocation, matProjUniformLocation;

let drag = false;
let last_x, last_y;
let ang_x = 0, ang_z = 0;
let rot_z = new Float32Array(16);
let rot_x = new Float32Array(16);

let bacterias = [], particles = [];

let mouse_coords = [];
let last_spawn = Date.now();

let playing = false;
let current_points = 0, highest_points = 0;

const { vec2, vec3, mat3, mat4 } = glMatrix;

function main() {
    init();

    var main_sphere = new Sphere(0.994, 72, 36, 0, 0, Math.PI);
    var main_sphere_lines = new Sphere(0.995, 72, 36, 0, 0, Math.PI, [207, 207, 196]);

    var render = function () {
        gl.clearColor(0.42745098, 0.407843137, 0.458823529, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        ctx.fillStyle = "rgba(1,1,1,0.0)";
        ctx.clearRect(0, 0, particle_canvas.width, particle_canvas.height);

        mat4.fromRotation(rot_x, ang_x, [1, 0, 0]);
        mat4.fromRotation(rot_z, ang_z, [0, 1, 0]);
        mat4.multiply(world, rot_x, rot_z);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, world);

        main_sphere.draw()
        main_sphere_lines.draw(gl.LINE_STRIP)

        if (playing) {
            bacterias.forEach(bacteria => {
                bacteria.draw();
            })
            Particle.draw()

            logic();
        }
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function init() {
    canvas = document.getElementById("glCanvas");
    particle_canvas = document.getElementById("particleCanvas");
    gl = canvas.getContext("webgl");
    ctx = particle_canvas.getContext("2d");

    if (!gl) {
        console.log('webgl not supported, falling back on experimental-webgl');
        gl = canvas.getContext('experimental-webgl');
    }
    if (!gl) {
        alert('your browser does not support webgl');
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Error compiling vertex shader!', gl.getShaderInfoLog(vertexShader))
        return;
    }
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Error compiling vertex shader!', gl.getShaderInfoLog(fragmentShader))
        return;
    }

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error linking program!', gl.getProgramInfo(program));
        return;
    }

    // Create and store data into vertex buffer
    vertex_buffer = gl.createBuffer();

    // Create and store data into color buffer
    color_buffer = gl.createBuffer();

    // Create and store data into index buffer
    index_buffer = gl.createBuffer();

    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);

    world = new Float32Array(16);
    mat4.identity(world);

    view = new Float32Array(16);
    mat4.lookAt(view, [0, 0, 5], [0, 0, 0], [0, 1, 0])

    proj = new Float32Array(16);
    mat4.perspective(proj, glMatrix.glMatrix.toRadian(30), canvas.width / canvas.height, 0.1, 100);

    matWorldUniformLocation = gl.getUniformLocation(program, 'world');
    matViewUniformLocation = gl.getUniformLocation(program, 'view');
    matProjUniformLocation = gl.getUniformLocation(program, 'proj');

    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, world);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, view);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, proj);

    //Mouse events
    particle_canvas.oncontextmenu = function () { return false; }
    particle_canvas.onmousedown = function (ev) {
        if (ev.button == 0) {
            var rect = ev.target.getBoundingClientRect();
            console.log(ev.clientX, ev.clientY)
            mouse_coords.push([ev.clientX - rect.left, rect.bottom - ev.clientY, ev.clientX - rect.left, ev.clientY - rect.top]);
        } else if (ev.button == 2) {
            last_x = ev.clientX;
            last_y = ev.clientY;
            drag = true;
        }
    }
    particle_canvas.onmouseup = function (ev) {
        drag = false;
    }
    particle_canvas.onmousemove = function (ev) {
        if (drag) {
            var x = ev.clientX;
            var y = ev.clientY;
            var factor = 0.01;
            var dx = factor * (x - last_x);
            var dy = factor * (y - last_y);
            ang_x += dy
            ang_z += dx
            last_x = x;
            last_y = y;
        }
    }
    document.getElementById("start_button").onclick = start_game;
}

function logic() {
    //Process mouse clicks
    while (mouse_coords.length) {
        var c = mouse_coords.shift();
        var pixelValues = new Uint8Array(4);
        gl.readPixels(c[0], c[1], 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelValues);

        for (var i = bacterias.length - 1; i >= 0; i--) {
            var bacteria = bacterias[i];
            if (bacteria.color[0] == pixelValues[0] &&
                bacteria.color[1] == pixelValues[1] &&
                bacteria.color[2] == pixelValues[2]) {

                current_points += Math.floor(bacteria.arc_angle * 50);
                current_points += Math.floor(0.5 / bacteria.arc_angle);
                bacterias.splice(i, 1);
                for (var j = 0; j < 30; j++) {
                    Particle.allParticles.push(new Particle(c[2], c[3]));
                }
            }
        }
    }

    if (bacterias.length == 0) {
        alert('You WON!! You killed all the bacterias!')
        game_over();
    }

    //Process particles
    var p_toberemove = [];
    for (var i = 0; i < Particle.allParticles.length; i++) {
        var particle = Particle.allParticles[i];
        particle.update();
        if (particle.transparency == 0) {
            p_toberemove.push(i);
        }
    }
    for (var i = 0; i < p_toberemove.length; i++) {
        Particle.allParticles.splice(p_toberemove[i], 1);
    }

    //Caculate collision
    var s_toberemove = [];
    for (var i = 0; i < bacterias.length - 1; i++) {
        for (var j = i + 1; j < bacterias.length; j++) {
            var b1 = bacterias[i];
            var b2 = bacterias[j]
            if (b1.collideWith(b2)) {
                s_toberemove.push(j);
                b1.arc_angle += b2.arc_angle / 2;
            }
        }
    }
    for (var i = 0; i < s_toberemove.length; i++) {
        bacterias.splice(s_toberemove[i], 1);
    }

    //Increment size and check if too big
    var threshold = Math.PI / 10;
    var over_threshold = 0;
    bacterias.forEach(bacteria => {
        bacteria.arc_angle += 0.001;
        if (bacteria.arc_angle > threshold) over_threshold++;
        bacteria.generate_data();
    })
    if (over_threshold >= 2) {
        alert('You loose! Two bacterias have grown too big!')
        game_over();
    }

    //Spawn more if less than 10;
    var spawn_interval = Math.floor(randomBetweenInterval(1000, 1500));
    if (bacterias.length <= 10) {
        if (Date.now() - last_spawn > spawn_interval) {
            bacterias.push(new Sphere(1, 36, 18,
                randomBetweenInterval(0, Math.PI),
                randomBetweenInterval(0, Math.PI),
                0.05,
                getRandomColor()
            ))
            last_spawn = Date.now();
        }
    }

    document.getElementById("current_score").innerHTML = current_points;
}

function start_game() {
    if (!playing) {
        bacterias = []
        Particle.allParticles = [];

        var amount = Math.floor(randomBetweenInterval(2, 5));
        for (var i = 0; i < amount; i++) {
            bacterias.push(new Sphere(1, 36, 18,
                randomBetweenInterval(0, Math.PI),
                randomBetweenInterval(0, Math.PI),
                0.05,
                getRandomColor()
            ))
        }

        current_points = 0;
        playing = true;
    }
}

function game_over() {
    playing = false;
    bacterias = []
    Particle.allParticles = [];

    if (current_points > highest_points) highest_points = current_points;
    document.getElementById("highest_score").innerHTML = highest_points;
}


class Sphere {
    constructor(radius, sectorCount, stackCount, angle_x = 0, angle_y = 0,
        arc_angle = Math.PI, color = [247, 237, 226]) {
        this.radius = radius;
        this.sectorCount = sectorCount;
        this.stackCount = stackCount;
        this.angle_x = angle_x;
        this.angle_y = angle_y;
        this.color = color;
        this.arc_angle = arc_angle;

        this.verticies = [];
        this.indicies = [];
        this.colors = [];

        this.generate_data();
    }

    generate_data() {
        var c = vec3.fromValues(this.color[0] / 255, this.color[1] / 255, this.color[2] / 255);
        this.verticies = [];
        this.colors = [];
        this.indicies = [];

        this.sectorStep = 2 * Math.PI / this.sectorCount;
        this.stackStep = this.arc_angle / this.stackCount;

        this.rot_x = new Float32Array(16);
        this.rot_y = new Float32Array(16);
        mat4.fromXRotation(this.rot_x, this.angle_x);
        mat4.fromYRotation(this.rot_y, this.angle_y);

        for (var i = 0; i <= this.stackCount; i++) {
            this.stackAngle = Math.PI / 2 - i * this.stackStep;
            var xy = this.radius * Math.cos(this.stackAngle);
            var z = this.radius * Math.sin(this.stackAngle);

            var k = i * (this.sectorCount + 1);
            var l = k + this.sectorCount + 1;

            for (var j = 0; j <= this.sectorCount; j++, k++, l++) {
                this.colors.push(...c); // Populate color array

                var sectorAngle = j * this.sectorStep;
                var x = xy * Math.cos(sectorAngle);
                var y = xy * Math.sin(sectorAngle);

                var pos = vec3.fromValues(x, y, z);
                vec3.transformMat4(pos, pos, this.rot_x);
                vec3.transformMat4(pos, pos, this.rot_y);
                this.verticies.push(...pos); // Populate verticies

                if (i != this.stackCount && j != this.sectorCount) {
                    if (i != 0) {
                        this.indicies.push(k, l, k + 1);
                    }

                    if (this.arc_angle != Math.PI || i != (this.stackCount - 1)) {
                        this.indicies.push(k + 1, l, l + 1);
                    }
                }
            }
        }
    }

    draw(mode = gl.TRIANGLES) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verticies), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indicies), gl.STATIC_DRAW);

        var positionAttribLocation = gl.getAttribLocation(program, 'position');
        var colorAttribLocation = gl.getAttribLocation(program, 'color');
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.vertexAttribPointer(
            positionAttribLocation, //attribute location
            3, //number of elements per attribute
            gl.FLOAT,
            gl.FALSE,
            0,
            0
        );
        gl.enableVertexAttribArray(positionAttribLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
        gl.vertexAttribPointer(
            colorAttribLocation, //attribute location
            3, //number of elements per attribute
            gl.FLOAT,
            gl.FALSE,
            0,
            0
        );
        gl.enableVertexAttribArray(colorAttribLocation);
        gl.drawElements(mode, this.indicies.length, gl.UNSIGNED_SHORT, 0);
    }

    collideWith(s) {
        var r = Math.max(this.radius, s.radius);
        var d = getHaversineDistance(this.angle_x, this.angle_y, s.angle_x, s.angle_y, r);
        return this.arc_angle + s.arc_angle > d;
    }
}

class Particle {
    static allParticles = [];

    constructor(
        center_x, center_y, radius = Math.floor(Math.random() * 10 + 5),
        vx = (Math.random() - 0.5) * 5, vy = (Math.random() - 0.5) * 5,
        color = hslToRgb(Math.random(), 0.25 + 0.7 * Math.random(), 0.7 + 0.1 * Math.random())
    ) {
        this.center_x = center_x;
        this.center_y = center_y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.transparency = 1;
        this.spawn_time = Date.now();
        this.decay_rate = Math.random() * 800;
    }

    update() {
        this.center_x += this.vx;
        this.center_y += this.vy;

        var time_diff = Date.now() - this.spawn_time;
        if (this.transparency != 0.0 && time_diff < this.decay_rate) {
            this.transparency = 1 - (time_diff / this.decay_rate);
        } else {
            this.transparency = 0.0;
        }
    }

    static draw() {
        Particle.allParticles.forEach(particle => {
            ctx.beginPath();
            ctx.fillStyle = `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, ${particle.transparency})`;
            // Draws a circle of radius 20 at the coordinates 100,100 on the canvas
            ctx.arc(particle.center_x, particle.center_y, particle.radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        });
    }
}

var vertexShaderText = `
precision mediump float;

    attribute vec3 position;
    attribute vec3 color;
    uniform mat4 world;
    uniform mat4 view;
    uniform mat4 proj;
    varying vec3 fragColor;

    void main()
    {
        mat4 mvp = proj*view*world;
        fragColor = color;
    	gl_Position = mvp*vec4(position, 1.0);
    	gl_PointSize = 10.0;
    }
`;

var fragmentShaderText = `
    precision mediump float;
    varying vec3 fragColor;
    void main()
    {
        gl_FragColor = vec4(fragColor, 1.0);
    }
`;

window.onload = main;