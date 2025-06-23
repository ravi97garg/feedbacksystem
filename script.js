    const preview = document.getElementById("preview");
    const recording = document.getElementById("recording");
    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("stopButton");
    const downloadButton = document.getElementById("downloadButton");
    const logElement = document.getElementById("log");

    const recordingTimeMS = 5000;

    function log(msg) {
      logElement.textContent += `${msg}\n`;
      console.log(msg);
    }

    function wait(delayInMS) {
      return new Promise((resolve) => setTimeout(resolve, delayInMS));
    }

    async function showCameraPreview() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: true,
      });

      preview.srcObject = stream;
      await preview.play();

      return preview.captureStream(); // Safe after play()
    }

    async function startRecording(stream, lengthInMS) {
      const recorder = new MediaRecorder(stream);
      let data = [];

      recorder.ondataavailable = (event) => data.push(event.data);
      recorder.start();
      log(`Recording started for ${lengthInMS / 1000} seconds...`);

      const stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = (event) => reject(event.name);
      });

      const recorded = wait(lengthInMS).then(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      });

      await Promise.all([stopped, recorded]);

      return data;
    }

    function stopTracks(stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    startButton.addEventListener("click", () => {
      startButton.style.display = "none";
      stopButton.style.display = "inline";

      showCameraPreview()
        .then((stream) => {
          preview.style.display = "block";
          return startRecording(stream, recordingTimeMS).then((recordedChunks) => {
            stopTracks(stream);

            const recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
            recording.src = URL.createObjectURL(recordedBlob);
            recording.hidden = false;
            downloadButton.href = recording.src;
            downloadButton.download = "RecordedVideo.webm";
            downloadButton.style.display = "inline";

            log(`Successfully recorded ${recordedBlob.size} bytes.`);
          });
        })
        .catch((error) => {
          if (error.name === "NotFoundError") {
            log("Camera or microphone not found.");
          } else {
            log(`Error: ${error}`);
          }
        });
    });

    stopButton.addEventListener("click", () => {
      preview.srcObject && stopTracks(preview.srcObject);
      preview.style.display = "none";
      stopButton.style.display = "none";
      log("Recording stopped manually.");
    });
