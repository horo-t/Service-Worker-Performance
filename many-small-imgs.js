done = false;

var results = {};

function addResult(key, time) {
  results[key] = {
    value: time,
    units: 'ms'
  };
}

function updateStatus(status) {
  console.log(status);
  var statusNode = document.getElementById('status');
  statusNode.innerHTML = status;
}

function complete() {
  done = true;
  var resultsNode = document.getElementById('results');
  for (key in results) {
    var result = results[key];
    var resultNode = document.createTextNode(
        '' + key + ': ' + result['value'] + ' ' + result['units']);
    resultsNode.appendChild(resultNode);
    resultsNode.appendChild(document.createElement('br'));
  }
  updateStatus('Completed!');
}


function waitUntilActive() {
  return function(registration) {
    new Promise(function(resolve, reject) {
      var serviceWorker;
      if (registration.active) {
        resolve(registration.active);
      } else if (registration.waiting) {
        serviceWorker = registration.waiting;
        serviceWorker.onstatechange = checkState;
      } else {
        serviceWorker = registration.installing;
        serviceWorker.onstatechange = checkState;
      }

      function checkState() {
        if (serviceWorker.state == 'activated') {
          serviceWorker.removeEventListener('statechange', checkState);
          resolve(serviceWorker);
        }
      }
    });
  }
}

function register(script, scope) {
  return function() {
    updateStatus('Register: ' + scope);
    return navigator.serviceWorker.register(script, {scope: scope});
  };
}

function unregister(scope) {
  return function() {
    updateStatus('Unregister: ' + scope);
    return navigator.serviceWorker.getRegistration(scope)
        .then(function(r){
          if (r)
            return r.unregister();
          else
            return new Promise();
        });
  };
}

function test(name, url) {
  return function() {
    var state = 'cold';
    return new Promise(function(resolve) {
      updateStatus('Run test: ' + name);
      var frame = document.createElement('iframe');
      frame.onload = function() {
        addResult(name, frame.contentWindow.performance.now());
        resolve();
      };
      frame.src = url;
      document.body.appendChild(frame);
    });
  }
}


var script = './fallback-worker.js';
var scope = '/resources/many-small-imgs-dataurl.html';
//var scope = '/resources/image-search.html';

function run() {
  test('out_scope0', scope)()
    .then(test('out_scope1', scope))
    .then(test('out_scope2', scope))
    .then(register(script, scope))
    .then(waitUntilActive())
    .then(test('in_scope0', scope))
    .then(test('in_scope1', scope))
    .then(test('in_scope2', scope))
    .then(unregister(scope))
    .then(complete);
}

window.onload = run;
