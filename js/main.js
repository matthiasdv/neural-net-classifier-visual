// x is an m x 2 matrix
// each neuron in the network will apply a linear transformation, a scale, and an activation function
// so we'll have to keep a list of transformations.
// to draw the perspective of a specific neuron, apply the transformation to each point of the input layer or original set

// drawing is functional because matrices only store numbers
function renderVertex(ctx, x, y, offsetX, offsetY, value) {
  ctx.beginPath();
  ctx.arc( x+offsetX, y+offsetY, 3, 0, TWO_PI );
  ctx.fillStyle = value ? 'green' : 'red';
  ctx.fill();
}

function renderGridVertex(ctx, x, y, offsetX, offsetY) {
  ctx.beginPath();
  ctx.arc( x+offsetX, y+offsetY, .5, 0, TWO_PI );
  ctx.fillStyle = '#eee';
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
    set: set
  }
}

function loop(conf) {
  const G = Matrix.zeros(conf.g, 2); // to display the grid
  const X = Matrix.zeros(conf.m, 2); // m x 2 matrix
  const Y = Matrix.zeros(conf.m, 1); // vector of length m

  const sketch = Sketch.create({
    container: document.getElementById('container'),
    retina: 'auto'
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

    // init data veritces
    for (let i=0 ; i<conf.m; i++) {
      X.set(i, 0, conf.set[i].one * wu);
      X.set(i, 1, conf.set[i].two * hu);
      Y.set(i, 0, conf.set[i].result)
    }
  };

  sketch.update = function() {
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
      renderGridVertex(sketch, xCoord, yCoord, oX, oY);
    }

    // render data vertices
    for (let i=0; i<conf.m; i++) {
      const xCoord = X.get(i, 0);
      const yCoord = X.get(i, 1);
      const label = Y.get(i, 0);

      renderVertex(sketch, xCoord, yCoord, oX, oY, label);
    }
  };
}



