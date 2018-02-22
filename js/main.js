// x is an m x 2 matrix
// each neuron in the network will apply a linear transformation, a scale, and an activation function
// so we'll have to keep a list of transformations.
// to draw the perspective of a specific neuron, apply the transformation to each point of the input layer or original set

// learning in the browser is absolute madness
// js should only be the presentation / animation layer
// run learning algorithm in octave
// after each iteration, get the parameters for each node (or edge?)
// re-read colah's article before writing any code to get transformation parameters
// THINK, before you code
const synaptic = window.synaptic;

// drawing is functional because matrices only store numbers
function renderVertex(ctx, x, y, offsetX, offsetY, value, radius) {
  ctx.beginPath();
  ctx.arc( x+offsetX, y+offsetY, radius, 0, TWO_PI );

  if (value !== undefined) {
    ctx.fillStyle = value ? 'green' : 'red';
  } else {
    ctx.fillStyle = '#eee';
  }

  ctx.fill();
}

loadData()
  .then(initMatrices)
  .then(loop);

async function loadData() {
  const response = await fetch('../data/grades.json');
  return await response.json();
}

async function initMatrices(set) {
  return {
    m: set.length,
    g: 400,
    set: prepSet(set),
    trainer: new synaptic.Trainer(new synaptic.Architect.Perceptron(2, 3, 2))
  }
}

function prepSet(set) {
  return set.map(el => ({
    input: [Math.round(el.one), Math.round(el.two)],
    output: [1-el.result, 0+el.result] // 1-x 0+x  yields [1,0] for Y=0 and [0,1] for Y=1
  }))
}

// lends itself to function composition
function affineTransformation(cv, tm, tv) {
  const a = linearTransformation(cv, tm);
  const b = translate(a, tv);

  return [Math.tanh(b[0]), Math.tanh(b[1])];
  // return b;
}

function linearTransformation(cv, t) {
  const x = cv[0]
  const y = cv[1]
  const a = t[0][0]
  const b = t[0][1]
  const c = t[1][0]
  const d = t[1][1]

  return [a*x + b*y, c*x + d*y]
}

function translate(cv, b) {
  const x = cv[0]
  const y = cv[1]
  return [x+b[0], y+b[1]]
}


function loop(conf) {
  const G = new Array(conf.g); // to display the grid
  const X = new Array(conf.m); // m x 2 matrix
  const Y = new Array(conf.m); // vector of length m

  // canvas
  const sketch = Sketch.create({
    container: document.getElementById('container'),
    retina: 'auto',
    interval: 20,
  });

  sketch.setup = function() {
    const w = 1;
    const h = 1;

    const gr = Math.sqrt(conf.g);

    console.log(`width: ${w}px height: ${h}px`);

    const wg = w / gr;
    const hg = h / gr;

    // init grid vertices
    for (let k=0 ; k<gr; k++) {
      for (let l=0 ; l<gr; l++) {
        // lendsitself perfectly to functional programming
        G[k*gr+l] = [k*wg - w/2, l*hg -w/2];
        // G[k*gr+l] = affineTransformation(G[k*gr+l], [[1, 0], [0, 1]], [0,0])
        // G[k*gr+l] = affineTransformation(G[k*gr+l], [[1.2, 0], [0.5, 1]], [0,0])
        G[k*gr+l] = affineTransformation(G[k*gr+l],[[1, 1.2], [-0.5, 3]], [0.1,0.7])
      }
    }

    console.log(G)
  };

  sketch.update = function() {
  };

  sketch.draw = function() {
    sketch.globalCompositeOperation  = 'lighter';

    const w = sketch.width / 2;
    const h = sketch.height / 2;

    const oX = w;
    const oY = h;


    // render grid vertices
    for (let j=0; j<conf.g; j++) {
      const xCoord = G[j][0] * 300;
      const yCoord = G[j][1] * 300;
      renderVertex(sketch, xCoord, yCoord, oX, oY, undefined, .5);
    }
  };
}



