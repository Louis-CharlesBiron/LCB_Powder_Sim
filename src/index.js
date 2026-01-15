const fpsCounter = new FPSCounter(), CVS = new Canvas(document.getElementById("sim"), null, 60)

CVS.start()


const simulation = new Simulation(CVS, new MapGrid())
simulation.addLoopExtra(()=>document.getElementById("fpsDisplay").textContent = fpsCounter.getFps()+" fps")




