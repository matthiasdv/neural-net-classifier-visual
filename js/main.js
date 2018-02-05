// x is an m x 2 matrix
// each neuron in the network will apply a linear transformation, a scale, and an activation function
// so we'll have to keep a list of transformations.
// to draw the perspective of a specific neuron, apply the transformation to each point of the input layer or original set

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
    set: set,
    net: makeNeuralNet()
  }
}

function makeNeuralNet() {
  const layer_defs = [];

  // input layer of size 1x1x2 (all volumes are 3D)
  layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:2});

  // hidden layer
  layer_defs.push({type:'fc', num_neurons:2, activation:'tanh'});

  // a softmax classifier predicting probabilities for two classes: 0,1
  layer_defs.push({type:'softmax', num_classes:2});

  // create a net out of it
  const net = new convnetjs.Net();
  net.makeLayers(layer_defs);

  return net;
}

function loop(conf) {
  const G = Matrix.zeros(conf.g, 2); // to display the grid
  const X = Matrix.zeros(conf.m, 2); // m x 2 matrix
  const Y = Matrix.zeros(conf.m, 1); // vector of length m
  const gridDistribution = [];

  // canvas
  const sketch = Sketch.create({
    container: document.getElementById('container'),
    retina: 'auto',
    interval: 20,
  });

  sketch.setup = function() {
    const w = sketch.width / 2;
    const h = sketch.height / 2;

    const wu = w/100;
    const hu = h/100;

    const gr = Math.sqrt(conf.g);

    console.log(`width: ${w}px height: ${h}px`);

    const wg = w / gr;
    const hg = h / gr;

    // init grid vertices
    for (let k=0 ; k<gr; k++) {
      for (let l=0 ; l<gr; l++) {
        G.set(k*gr+l, 0, k*wg);
        G.set(k*gr+l, 1, l*hg);
      }
    }

    // init data vertices
    for (let i=0 ; i<conf.m; i++) {
      X.set(i, 0, conf.set[i].one * wu);
      X.set(i, 1, conf.set[i].two * hu);
      Y.set(i, 0, conf.set[i].result)
    }
  };

  sketch.update = function() {
    // train neural net on sample data
    const timeStart = Date.now();
    console.log('training...');

    const trainer = new convnetjs.Trainer(conf.net, {method: 'adadelta', l2_decay: 0.001, batch_size: 10});

    for (let i=0; i<conf.m; i++) {
      // console.log(X.get(i, 0), X.get(i, 1), Y.get(i, 0));
      const x = new convnetjs.Vol([X.get(i, 0), X.get(i, 1)]);
      trainer.train(x, Y.get(i, 0)); // this could simply be an array
      // NEXT TIME: Take a look at the trainer in the docs. Training should provide probabilities
    }

    const timeStop = Date.now();
    // console.log(`done! training took ${timeStop - timeStart}ms`);

    // forward the grid points to plot the decision boundry
    for (let j=0; j<conf.g; j++) {
      const x = new convnetjs.Vol([G.get(j, 0), G.get(j, 1)]);
      gridDistribution[j] = conf.net.forward(x);
      // console.log(G.get(j, 0), G.get(j, 1), gridDistribution[j].w);
    }
  };

  sketch.draw = function() {
    sketch.globalCompositeOperation  = 'lighter';

    const w = sketch.width / 2;
    const h = sketch.height / 2;

    const wu = w/100;
    const hu = h/100;

    const oX = w / 2;
    const oY = h / 2;

    // render frame
    sketch.strokeStyle = '#eee';
    sketch.rect(oX,oY,100*wu,100*hu);
    sketch.stroke();

    // render grid vertices
    for (let j=0; j<conf.g; j++) {
      const xCoord = G.get(j, 0);
      const yCoord = G.get(j, 1);
      renderVertex(sketch, xCoord, yCoord, oX, oY, gridDistribution[j].w[1] > .5, .5);
    }

    // render data vertices
    for (let i=0; i<conf.m; i++) {
      const xCoord = X.get(i, 0);
      const yCoord = X.get(i, 1);
      const label = Y.get(i, 0);

      renderVertex(sketch, xCoord, yCoord, oX, oY, label, 3);
    }
  };
}



