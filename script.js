let preview = document.getElementById("preview");
let recording = document.getElementById("recording");
let startButton = document.getElementById("startButton");
let stopButton = document.getElementById("stopButton");
let downloadButton = document.getElementById("downloadButton");
let logElement = document.getElementById("log");

let recordingTimeMS = 5000;

function log(msg) {
    console.log(`${msg}\n`);
}

function wait(delayInMS) {
    return new Promise((resolve) => setTimeout(resolve, delayInMS));
}

async function showCameraPreview() {
    const stream = await navigator.mediaDevices
        .getUserMedia({
            video: { facingMode: { exact: "environment" } },
            audio: true,
        });
    preview.srcObject = stream;
    downloadButton.href = stream;
    preview.captureStream =
        preview.captureStream || preview.mozCaptureStream;
    return await new Promise((resolve) => {
        preview.onplaying = resolve;
    });
}

async function startRecording(stream, lengthInMS) {
    let recorder = new MediaRecorder(stream);
    let data = [];

    recorder.ondataavailable = (event) => data.push(event.data);
    recorder.start();
    log(`${recorder.state} for ${lengthInMS / 1000} seconds…`);

    let stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = (event) => reject(event.name);
    });

    let recorded = wait(lengthInMS).then(() => {
        if (recorder.state === "recording") {
            recorder.stop();
        }
    });

    await Promise.all([stopped, recorded]);
    return data;
}

function stop(stream) {
    stream.getTracks().forEach((track) => track.stop());
}

startButton.addEventListener(
    "click", () => {
        document.getElementById("stopButton").style.display = "flex";
        document.getElementById("startButton").style.display = "none";
        showCameraPreview().then(() => startRecording(preview.captureStream(), recordingTimeMS))
            .then((recordedChunks) => {
                let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
                recording.src = URL.createObjectURL(recordedBlob);
                downloadButton.href = recording.src;
                downloadButton.download = "RecordedVideo.webm";

                log(
                    `Successfully recorded ${recordedBlob.size} bytes of ${recordedBlob.type} media.`,
                );
            })
            .catch((error) => {
                if (error.name === "NotFoundError") {
                    log("Camera or microphone not found. Can't record.");
                } else {
                    log(error);
                }
            });
    });

stopButton.addEventListener(
    "click",
    () => {
        // stop preview
        stop(preview.srcObject);
        document.getElementById("preview").style.display = "none";
        // show recording
        document.getElementById("recording").hidden = false;
        // show download button
        document.getElementById("stopButton").style.display = "none";
        document.getElementById("downloadButton").style.display = "flex";
    },
    false,
);

