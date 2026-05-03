// app.js

// 1. Import all your modules
import Module1DKinematics from './modules/Kinematics1d.js';
import Module2DKinematics from './modules/Kinematics2d.js';
import Problem3_FreeBody from './modules/Problem3_FreeBody.js';
import MonkeyHunter from './modules/MonkeyHunter.js';
import VectorPopup from './core/VectorPopup.js';
import AtwoodRamp from './modules/AtwoodRamp.js';
import AtwoodFlat1Pulley from './modules/AtwoodFlat1Pulley.js';
import AtwoodPulley from './modules/AtwoodPulley.js';
import UnitConversion from './modules/UnitConversion.js';

// 2. Register them in the Hub
const MODULE_REGISTRY = {
    "Problem 1: 1D Acceleration (Car/Ball)": Module1DKinematics,
     "Problem 2: 2D Projectile Motion": Module2DKinematics,
     "Problem 3: Free Body Diagram": Problem3_FreeBody,
     "Monkey & Hunter": MonkeyHunter,
        "Atwood Machine: Ramp": AtwoodRamp,
        "Atwood Machine: Flat 1 Pulley": AtwoodFlat1Pulley,
        "Atwood Machine: Classic Pulley": AtwoodPulley,
        "Dimensional Analysis Setup": UnitConversion
};

let currentSimulationInstance = null;
const vectorPopup = new VectorPopup();

window.onload = function() {
    const selector = document.getElementById('problemSelector');
    
    Object.keys(MODULE_REGISTRY).forEach((moduleName) => {
        const option = document.createElement('option');
        option.value = moduleName; option.innerText = moduleName;
        selector.appendChild(option);
    });

    const loadModule = (moduleName) => {
        if (currentSimulationInstance) currentSimulationInstance.stopPreview();
        document.getElementById('canvasTitle').innerText = moduleName + " Preview";
        document.getElementById('outputContainer').classList.add('hidden');
        const ModuleClass = MODULE_REGISTRY[moduleName];
        currentSimulationInstance = new ModuleClass('simCanvas');
        currentSimulationInstance.vectorPopup = vectorPopup;
        currentSimulationInstance.init(); 
    };

    selector.addEventListener('change', (e) => loadModule(e.target.value));
    loadModule(selector.value);

    document.getElementById('playBtn').addEventListener('click', () => {
        if(currentSimulationInstance) currentSimulationInstance.playPreview();
    });

    document.getElementById('exportSvgBtn').addEventListener('click', () => {
        if(!currentSimulationInstance) return;
        try {
            document.getElementById('status').innerText = "Exporting SVG...";
            currentSimulationInstance.exportSvg();
            document.getElementById('status').innerText = "SVG Downloaded!";
            setTimeout(() => document.getElementById('status').innerText = "System Ready", 2000);
        } catch (e) {
            console.error(e);
            document.getElementById('status').innerText = "SVG Export Failed";
        }
    });

    document.getElementById('vectorBtn').addEventListener('click', () => {
        const config = currentSimulationInstance?.getVectorConfig?.() ?? { magnitude: 10, angleDeg: 35 };
        vectorPopup.open(config);
    });

    document.getElementById('exportBtn').addEventListener('click', async () => {
        if(!currentSimulationInstance) return;
        const btn = document.getElementById('exportBtn');
        const statusEl = document.getElementById('status');
        const outputImg = document.getElementById('outputGif');
        const outputContainer = document.getElementById('outputContainer');
        
        btn.disabled = true; btn.classList.add('opacity-50');
        statusEl.innerText = "Rendering frames...";
        outputContainer.classList.add('hidden');
        
        try {
            const gifBase64 = await currentSimulationInstance.exportGif((progress) => {
                statusEl.innerText = `Compiling: ${Math.round(progress * 100)}%`;
            });
            statusEl.innerText = "Export finished!";
            outputImg.src = gifBase64;
            outputContainer.classList.remove('hidden');
        } catch (error) {
            statusEl.innerText = "Error compiling GIF.";
            console.error(error);
        } finally {
            btn.disabled = false; btn.classList.remove('opacity-50');
        }
    });
};