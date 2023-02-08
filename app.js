//Author: Frank Perez
'use strict'

var gl;

var appInput = new Input();
var time = new Time();
var camera = new OrbitCamera(appInput);

var sun = null; // this will be created after loading from a file
var mercury = null;
var venus = null;
var earth = null;
var moon = null;
var mars = null;
var jupiter = null;
var saturn = null;
var uranus = null;
var neptune = null;
var cloud = null;

//mercury venus earth moon mars jupiter saturn uranus neptune
var barrelGeometry = null;

var negativeXGeometry = null;
var negativeYGeometry = null;
var negativeZGeometry = null;
var positiveXGeometry = null;
var positiveYGeometry = null;
var positiveZGeometry = null;

var projectionMatrix = new Matrix4();
var lightPosition = new Vector3();

// the shader that will be used by each piece of geometry (they could each use their own shader but in this case it will be the same)
var phongShaderProgram;
var basicColorProgram;

// auto start the app when the html page is ready
window.onload = window['initializeAndStartRendering'];

// we need to asynchronously fetch files from the "server" (your local hard drive)
var loadedAssets = {
    phongTextVS: null, phongTextFS: null,
    vertexColorVS: null, vertexColorFS: null,
    sphereJSON: null,
    marbleImage: null,
    crackedMudImage: null,
    barrelJSON: null,
    barrelImage: null
};

// -------------------------------------------------------------------------
function initializeAndStartRendering() {
    initGL();
    loadAssets(function() {
        createShaders(loadedAssets);
        createScene();

        updateAndRender();
    });
}

// -------------------------------------------------------------------------
function initGL(canvas) {
    var canvas = document.getElementById("webgl-canvas");

    try {
        gl = canvas.getContext("webgl");
        gl.canvasWidth = canvas.width;
        gl.canvasHeight = canvas.height;

        gl.enable(gl.DEPTH_TEST);
    } catch (e) {}

    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

// -------------------------------------------------------------------------
function loadAssets(onLoadedCB) {
    var filePromises = [
        fetch('./shaders/phong.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/phong.pointlit.fs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/flat.color.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/flat.color.fs.glsl').then((response) => { return response.text(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        loadImage('./data/marble.jpg'),
        loadImage('./data/crackedMud.png'),
        fetch('./data/barrel.json').then((response) => { return response.json(); }),
        loadImage('./data/barrel.png'),
        loadImage('./data/Final/sun.jpg'),
        loadImage('./data/Final/Additional Planets/mercury.jpg'),
        loadImage('./data/Final/Additional Planets/venusAt.jpg'),
        loadImage('./data/Final/earth.jpg'),
        loadImage('./data/Final/moon.png'),
        loadImage('./data/Final/Additional Planets/mars.jpg'),
        loadImage('./data/Final/Additional Planets/jupiter.jpg'),
        loadImage('./data/Final/Additional Planets/saturn.jpg'),
        loadImage('./data/Final/Additional Planets/uranus.jpg'),
        loadImage('./data/Final/Additional Planets/neptune.jpg'),
        loadImage('./data/Final/Skybox Faces/GalaxyTex_NegativeX.png'),
        loadImage('./data/Final/Skybox Faces/GalaxyTex_NegativeY.png'),
        loadImage('./data/Final/Skybox Faces/GalaxyTex_NegativeZ.png'),
        loadImage('./data/Final/Skybox Faces/GalaxyTex_PositiveX.png'),
        loadImage('./data/Final/Skybox Faces/GalaxyTex_PositiveY.png'),
        loadImage('./data/Final/Skybox Faces/GalaxyTex_PositiveZ.png'),
        loadImage('./data/Final/Earth Day-Night-Clouds/2k_earth_clouds.jpg')
    ];
    Promise.all(filePromises).then(function(values) {
        // Assign loaded data to our named variables
        loadedAssets.phongTextVS = values[0];
        loadedAssets.phongTextFS = values[1];
        loadedAssets.vertexColorVS = values[2];
        loadedAssets.vertexColorFS = values[3];
        loadedAssets.sphereJSON = values[4];
        loadedAssets.marbleImage = values[5];
        loadedAssets.crackedMudImage = values[6];
        loadedAssets.barrelJSON = values[7];
        loadedAssets.barrelImage = values[8];
        loadedAssets.sunImage = values[9];
        loadedAssets.mercuryImage = values[10];
        loadedAssets.venusImage = values[11];
        loadedAssets.earthImage = values[12];
        loadedAssets.moonImage = values[13];
        loadedAssets.marsImage = values[14];
        loadedAssets.jupiterImage = values[15];
        loadedAssets.saturnImage = values[16];
        loadedAssets.uranusImage = values[17];
        loadedAssets.neptuneImage = values[18];
        loadedAssets.NegativeXimage = values[19];
        loadedAssets.NegativeYimage = values[20];
        loadedAssets.NegativeZimage = values[21];
        loadedAssets.PositiveXimage = values[22];
        loadedAssets.PositiveYimage = values[23];
        loadedAssets.PositiveZimage = values[24];
        loadedAssets.clouds = values[25];
    }).catch(function(error) {
        console.error(error.message);
    }).finally(function() {
        onLoadedCB();
    });
}

// -------------------------------------------------------------------------
function createShaders(loadedAssets) {
    phongShaderProgram = createCompiledAndLinkedShaderProgram(loadedAssets.phongTextVS, loadedAssets.phongTextFS);

    phongShaderProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(phongShaderProgram, "aVertexPosition"),
        vertexNormalsAttribute: gl.getAttribLocation(phongShaderProgram, "aNormal"),
        vertexTexcoordsAttribute: gl.getAttribLocation(phongShaderProgram, "aTexcoords")
    };

    phongShaderProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uProjectionMatrix"),
        lightPositionUniform: gl.getUniformLocation(phongShaderProgram, "uLightPosition"),
        cameraPositionUniform: gl.getUniformLocation(phongShaderProgram, "uCameraPosition"),
        textureUniform: gl.getUniformLocation(phongShaderProgram, "uTexture"),
    };

    basicColorProgram = createCompiledAndLinkedShaderProgram(loadedAssets.vertexColorVS, loadedAssets.vertexColorFS);
    gl.useProgram(basicColorProgram);

    basicColorProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(basicColorProgram, "aVertexPosition"),
        vertexColorsAttribute: gl.getAttribLocation(basicColorProgram, "aVertexColor"),
    };

    basicColorProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(basicColorProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(basicColorProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(basicColorProgram, "uProjectionMatrix"),
        colorUniform: gl.getUniformLocation(basicColorProgram, "uColor")
    };
}

// -------------------------------------------------------------------------
function createScene() {
    //negative x
    negativeXGeometry = new WebGLGeometryQuad(gl, phongShaderProgram);
    negativeXGeometry.create(loadedAssets.NegativeXimage);
    var gmscale = new Matrix4().makeScale(500.0, 500.0, 500.0);
    // compensate for the model being flipped on its side
    var rotation = new Matrix4().makeRotationX(-90);
    var rotat2 = new Matrix4().makeRotationZ(270);
    negativeXGeometry.worldMatrix.makeIdentity();//.multiply(rotat2);
    var translation = new Matrix4().makeTranslation(0, -500, 0);
    negativeXGeometry.worldMatrix.multiply(translation);
    negativeXGeometry.worldMatrix.multiply(rotation).multiply(gmscale).multiply(rotat2);
    //
    //positive x
    positiveXGeometry = new WebGLGeometryQuad(gl, phongShaderProgram);
    positiveXGeometry.create(loadedAssets.PositiveXimage);
    var gmscale = new Matrix4().makeScale(500.0, 500.0, 500.0);
    // compensate for the model being flipped on its side
    var rotation = new Matrix4().makeRotationX(-90);
    var rotat2 = new Matrix4().makeRotationZ(90);
    positiveXGeometry.worldMatrix.makeIdentity();
    var translation = new Matrix4().makeTranslation(0, 500, 0);
    positiveXGeometry.worldMatrix.multiply(translation);
    positiveXGeometry.worldMatrix.multiply(rotation).multiply(gmscale).multiply(rotat2);
    //
    //negative y
    negativeYGeometry = new WebGLGeometryQuad(gl, phongShaderProgram);
    negativeYGeometry.create(loadedAssets.NegativeYimage);
    var gmscale = new Matrix4().makeScale(500.0, 500.0, 500.0);
    // compensate for the model being flipped on its side
    var rotation = new Matrix4().makeRotationY(-90);
    negativeYGeometry.worldMatrix.makeIdentity();
    var translation = new Matrix4().makeTranslation(-500, 0, 0);
    negativeYGeometry.worldMatrix.multiply(translation);
    negativeYGeometry.worldMatrix.multiply(rotation).multiply(gmscale);
    //
    //positive y
    positiveYGeometry = new WebGLGeometryQuad(gl, phongShaderProgram);
    positiveYGeometry.create(loadedAssets.PositiveYimage);
    var gmscale = new Matrix4().makeScale(500.0, 500.0, 500.0);
    // compensate for the model being flipped on its side
    var rotation = new Matrix4().makeRotationY(-90);
    positiveYGeometry.worldMatrix.makeIdentity();
    var translation = new Matrix4().makeTranslation(500, 0, 0);
    positiveYGeometry.worldMatrix.multiply(translation);
    positiveYGeometry.worldMatrix.multiply(rotation).multiply(gmscale);
    //
    //negative z
    negativeZGeometry = new WebGLGeometryQuad(gl, phongShaderProgram);
    negativeZGeometry.create(loadedAssets.NegativeZimage);
    var gmscale = new Matrix4().makeScale(500.0, 500.0, 500.0);
    // compensate for the model being flipped on its side
    var rotation = new Matrix4().makeRotationZ(-90);
    negativeZGeometry.worldMatrix.makeIdentity();
    var translation = new Matrix4().makeTranslation(0, 0, -500);
    negativeZGeometry.worldMatrix.multiply(translation);
    negativeZGeometry.worldMatrix.multiply(rotation).multiply(gmscale);
    //
    //positive z
    positiveZGeometry = new WebGLGeometryQuad(gl, phongShaderProgram);
    positiveZGeometry.create(loadedAssets.PositiveZimage);
    var gmscale = new Matrix4().makeScale(500.0, 500.0, 500.0);
    // compensate for the model being flipped on its side
    var rotation = new Matrix4().makeRotationZ(90);
    positiveZGeometry.worldMatrix.makeIdentity();
    var translation = new Matrix4().makeTranslation(0, 0, 500);
    positiveZGeometry.worldMatrix.multiply(translation);
    positiveZGeometry.worldMatrix.multiply(rotation).multiply(gmscale);
    //

    
    sun = new WebGLGeometryJSON(gl, basicColorProgram);//phongShaderProgram);
    sun.create(loadedAssets.sphereJSON, loadedAssets.sunImage);

    // Scaled it down so that the diameter is 3
    var scale = new Matrix4().makeScale(0.07,0.07,0.07); //(0.03, 0.03, 0.03);

    // raise it by the radius to make it sit on the ground
    var translation = new Matrix4().makeTranslation(0, 1.5, 0);
    
    sun.worldMatrix.makeIdentity();
    sun.worldMatrix.multiply(translation).multiply(scale);
    //sun.worldMatrix.multiply(rotation).multiply(translation).multiply(scale);

    //mercury venus earth moon mars jupiter saturn uranus neptune
    mercury = new WebGLGeometryJSON(gl, phongShaderProgram);//basicColorProgram);
    mercury.create(loadedAssets.sphereJSON, loadedAssets.mercuryImage);
    var mScaleM = new Matrix4().makeScale(0.004, 0.004, 0.004);
    var mTranslate = new Matrix4().makeTranslation(0, 2, 0);
    mercury.worldMatrix.makeIdentity().multiply(mTranslate).multiply(mScaleM);
    //venus
    venus = new WebGLGeometryJSON(gl, phongShaderProgram);
    venus.create(loadedAssets.sphereJSON, loadedAssets.venusImage);
    var vScaleM = new Matrix4().makeScale(0.005, 0.005, 0.005);
    venus.worldMatrix.makeIdentity().multiply(vScaleM);
    //earth
    earth = new WebGLGeometryJSON(gl, phongShaderProgram);
    earth.create(loadedAssets.sphereJSON, loadedAssets.earthImage);
    var eScaleM = new Matrix4().makeScale(0.007, 0.007, 0.007);
    earth.worldMatrix.makeIdentity().multiply(eScaleM);
    //cloudy earth
    cloud = new WebGLGeometryJSON(gl, phongShaderProgram);
    cloud.create(loadedAssets.sphereJSON, loadedAssets.clouds);
    
    var ceScaleM = new Matrix4().makeScale(0.0071, 0.0071, 0.0071);
    cloud.worldMatrix.makeIdentity().multiply(ceScaleM);
    //moon
    moon = new WebGLGeometryJSON(gl, phongShaderProgram);
    moon.create(loadedAssets.sphereJSON, loadedAssets.moonImage);
    var moScaleM = new Matrix4().makeScale(0.003, 0.003, 0.003);
    moon.worldMatrix.makeIdentity().multiply(moScaleM);
    //mars
    mars = new WebGLGeometryJSON(gl, phongShaderProgram);
    mars.create(loadedAssets.sphereJSON, loadedAssets.marsImage);
    var maScaleM = new Matrix4().makeScale(0.008, 0.008, 0.008);
    mars.worldMatrix.makeIdentity().multiply(maScaleM);
    //jupiter
    jupiter = new WebGLGeometryJSON(gl, phongShaderProgram);
    jupiter.create(loadedAssets.sphereJSON, loadedAssets.jupiterImage);
    var jScaleM = new Matrix4().makeScale(0.05, 0.05, 0.05);
    jupiter.worldMatrix.makeIdentity().multiply(jScaleM);
    //saturn
    saturn = new WebGLGeometryJSON(gl, phongShaderProgram);
    saturn.create(loadedAssets.sphereJSON, loadedAssets.saturnImage);
    var saScaleM = new Matrix4().makeScale(0.04, 0.04, 0.04);
    saturn.worldMatrix.makeIdentity().multiply(saScaleM);
    //uranus
    uranus = new WebGLGeometryJSON(gl, phongShaderProgram);
    uranus.create(loadedAssets.sphereJSON, loadedAssets.uranusImage);
    var urScaleM = new Matrix4().makeScale(0.01, 0.01, 0.01);
    uranus.worldMatrix.makeIdentity().multiply(urScaleM);
    //neptune
    neptune = new WebGLGeometryJSON(gl, phongShaderProgram);
    neptune.create(loadedAssets.sphereJSON, loadedAssets.neptuneImage);
    var nepScaleM = new Matrix4().makeScale(0.01, 0.01, 0.01);
    neptune.worldMatrix.makeIdentity().multiply(nepScaleM);
}

// -------------------------------------------------------------------------
function updateAndRender() {
    requestAnimationFrame(updateAndRender);

    var aspectRatio = gl.canvasWidth / gl.canvasHeight;

    time.update();
    camera.update(time.deltaTime);

    var cosTime = Math.cos(time.secondsElapsedSinceStart);
    var sinTime = Math.sin(time.secondsElapsedSinceStart);

    // special case rotation where the vector is along the x-axis (4, 0)
    var lightDistance = 4;//og was 4
    lightPosition.x = cosTime * lightDistance;
    lightPosition.y = 1.5;
    lightPosition.z = sinTime * lightDistance;

    //mercury venus earth moon mars jupiter saturn uranus neptune
    //bottom code dictates the camera's perspective

    //sun.worldMatrix.elements[3] = lightPosition.x;
    //sun.worldMatrix.elements[7] = lightPosition.y;
    //sun.worldMatrix.elements[11] = lightPosition.z;
    var sunRotation = new Matrix4().makeRotationY(time.sun).inverse();
    sun.worldMatrix.multiply(sunRotation);

    mercury.worldMatrix.elements[3] = cosTime * 4;
    mercury.worldMatrix.elements[7] = 1.5;
    mercury.worldMatrix.elements[11] = sinTime * 4;

    venus.worldMatrix.elements[3] = (Math.cos(time.venus)) * 5;
    venus.worldMatrix.elements[7] = 1.5;
    venus.worldMatrix.elements[11] = (Math.sin(time.venus)) * 5;

    var earthRotation = new Matrix4().makeRotationY(time.earthaxis).inverse();
    earth.worldMatrix.multiply(earthRotation);

    earth.worldMatrix.elements[3] = (Math.cos(time.earth)) * 7;
    earth.worldMatrix.elements[7] = 1.5;
    earth.worldMatrix.elements[11] = (Math.sin(time.earth)) * 7;

    cloud.worldMatrix.elements[3] = (Math.cos(time.earth)) * 7;
    cloud.worldMatrix.elements[7] = 1.5;
    cloud.worldMatrix.elements[11] = (Math.sin(time.earth)) * 7;
    //change the origin to the earth's
    moon.worldMatrix.elements[3] = earth.worldMatrix.elements[3] + (Math.cos(time.moon));
    moon.worldMatrix.elements[7] = earth.worldMatrix.elements[7];
    moon.worldMatrix.elements[11] = earth.worldMatrix.elements[11] + (Math.sin(time.moon));

    mars.worldMatrix.elements[3] = (Math.cos(time.mars)) * 9;
    mars.worldMatrix.elements[7] = 1.5;
    mars.worldMatrix.elements[11] = (Math.sin(time.mars)) * 9;
    //
    jupiter.worldMatrix.elements[3] = Math.cos(time.jupiter) * 13;
    jupiter.worldMatrix.elements[7] = 1.5;
    jupiter.worldMatrix.elements[11] = Math.sin(time.jupiter) * 13;

    saturn.worldMatrix.elements[3] = (Math.cos(time.saturn)) * 19;
    saturn.worldMatrix.elements[7] = 1.5;
    saturn.worldMatrix.elements[11] = (Math.sin(time.saturn)) * 19;

    uranus.worldMatrix.elements[3] = (Math.cos(time.uranus)) * 22;
    uranus.worldMatrix.elements[7] = 1.5;
    uranus.worldMatrix.elements[11] = (Math.sin(time.uranus)) * 22;

    neptune.worldMatrix.elements[3] = (Math.cos(time.neptune)) * 25;
    neptune.worldMatrix.elements[7] = 1.5;
    neptune.worldMatrix.elements[11] = (Math.sin(time.neptune)) * 25;

    // specify what portion of the canvas we want to draw to (all of it, full width and height)
    gl.viewport(0, 0, gl.canvasWidth, gl.canvasHeight);

    // this is a new frame so let's clear out whatever happened last frame
    gl.clearColor(0.707, 0.707, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
;
    gl.useProgram(phongShaderProgram);
    var uniforms = phongShaderProgram.uniforms;
    var cameraPosition = camera.getPosition();
    //cameraPosition = earth.worldMatrix;
    //lightPosition.x, lightPosition.y, lightPosition.z); affects where light shines from
    gl.uniform3f(uniforms.lightPositionUniform, sun.worldMatrix.elements[3], sun.worldMatrix.elements[7], sun.worldMatrix.elements[11]);
    gl.uniform3f(uniforms.cameraPositionUniform, cameraPosition.x, cameraPosition.y, cameraPosition.z);

    //function(fovy, aspect, near, far)
    //projectionMatrix.makePerspective(45, aspectRatio, 0.1, 1000); //default
    projectionMatrix.makePerspective(80,aspectRatio,1.0, 1000);

    negativeXGeometry.render(camera, projectionMatrix, phongShaderProgram);
    positiveXGeometry.render(camera, projectionMatrix, phongShaderProgram);
    negativeYGeometry.render(camera, projectionMatrix, phongShaderProgram);
    positiveYGeometry.render(camera, projectionMatrix, phongShaderProgram);
    negativeZGeometry.render(camera, projectionMatrix, phongShaderProgram);
    positiveZGeometry.render(camera, projectionMatrix, phongShaderProgram);

    //planet render mercury venus earth moon mars jupiter saturn uranus neptune
    sun.render(camera, projectionMatrix, phongShaderProgram);
    mercury.render(camera, projectionMatrix, phongShaderProgram);
    venus.render(camera, projectionMatrix, phongShaderProgram);
    earth.render(camera, projectionMatrix, phongShaderProgram);
    //cloud.render(camera, projectionMatrix, phongShaderProgram);
    moon.render(camera, projectionMatrix, phongShaderProgram);
    mars.render(camera, projectionMatrix, phongShaderProgram);
    jupiter.render(camera, projectionMatrix, phongShaderProgram);
    saturn.render(camera, projectionMatrix, phongShaderProgram);
    uranus.render(camera, projectionMatrix, phongShaderProgram);
    neptune.render(camera, projectionMatrix, phongShaderProgram);

    /*gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    cloud.render(camera, projectionMatrix, phongShaderProgram);
    gl.disable(gl.BLEND);*/

    
    gl.useProgram(basicColorProgram);
    gl.uniform4f(basicColorProgram.uniforms.colorUniform, 1.0, 1.0, 1.0, 1.0);

    //mercury.render(camera, projectionMatrix, basicColorProgram);
}
