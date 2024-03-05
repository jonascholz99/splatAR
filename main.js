import * as SPLAT from 'gsplat';
import * as THREE from 'three';

let trenderer, xrRefSpace, tscene, tcamera;
const renderer = new SPLAT.WebGLRenderer();
const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();

init();

function onWindowResize() 
{
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize);

var button = document.createElement( 'button' );
button.id = 'ArButton';
button.textContent = 'ENTER AR';
button.style.cssText += `position: absolute;top:80%;left:40%;width:20%;height:2rem;`;

document.body.appendChild( button );
button.addEventListener( 'click',x=>AR() )

main();

async function main() 
{  
  const url = "./splats/yona/yona_7000.splat";
  await SPLAT.Loader.LoadAsync(url, scene, () => {});

  const frame = () => {
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);

}

function init() {
  tscene = new THREE.Scene();
  tcamera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.01, 50 );
  trenderer = new THREE.WebGLRenderer( {antialias: true });
  trenderer.setPixelRatio( window.devicePixelRatio );
  trenderer.setSize( window.innerWidth, window.innerHeight );
  trenderer.xr.enabled = true;
}

function AR() 
{
  var currentSession = null;
  
  if( currentSession == null )
  {
    let options = {
      requiredFeatures: ['dom-overlay'],
      domOverlay: { root: document.body },
    };
    var sessionInit = getXRSessionInit( 'immersive-ar', {
      mode: 'immersive-ar',
      referenceSpaceType: 'local', // 'local-floor'
      sessionInit: options
  });
  
  navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );
  } else {
    currentSession.end();
  }

  trenderer.xr.addEventListener('sessionstart', function(ev) {
    console.log('sessionstart', ev);
  });
  trenderer.xr.addEventListener('sessionend', function(ev) {
    console.log('sessionend', ev);
  });

  function onSessionStarted( session ) {
    session.addEventListener( 'end', onSessionEnded );
    trenderer.xr.setSession( session );
    button.style.display = 'none';
    button.textContent = 'EXIT AR';
    currentSession = session;
    session.requestReferenceSpace('local').then((refSpace) => {
      xrRefSpace = refSpace;
      session.requestAnimationFrame(onXRFrame);
    });
  }
  function onSessionEnded( /*event*/ ) {
    currentSession.removeEventListener( 'end', onSessionEnded );
    trenderer.xr.setSession( null );
    button.textContent = 'ENTER AR' ;
    currentSession = null;
  }
}

function getXRSessionInit(mode, options) {
  if ( options && options.referenceSpaceType ) {
      trenderer.xr.setReferenceSpaceType( options.referenceSpaceType );
  }
  var space = (options || {}).referenceSpaceType || 'local-floor';
  var sessionInit = (options && options.sessionInit) || {};

  // Nothing to do for default features.
  if ( space == 'viewer' )
      return sessionInit;
  if ( space == 'local' && mode.startsWith('immersive' ) )
      return sessionInit;

  // If the user already specified the space as an optional or required feature, don't do anything.
  if ( sessionInit.optionalFeatures && sessionInit.optionalFeatures.includes(space) )
      return sessionInit;
  if ( sessionInit.requiredFeatures && sessionInit.requiredFeatures.includes(space) )
      return sessionInit;

  var newInit = Object.assign( {}, sessionInit );
  newInit.requiredFeatures = [ space ];
  if ( sessionInit.requiredFeatures ) {
      newInit.requiredFeatures = newInit.requiredFeatures.concat( sessionInit.requiredFeatures );
  }
  return newInit;
}