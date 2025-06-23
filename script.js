const preview = document.getElementById("preview");
const recording = document.getElementById("recording");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const downloadButton = document.getElementById("downloadButton");

let mediaRecorder;
let recordedChunks = [];

async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: true
        });
        preview.srcObject = stream;
        await preview.play();
    } catch (err) {
        alert("Unable to access camera and microphone: " + err.message);
    }
}

initCamera();

startButton.addEventListener("click", () => {
    const stream = preview.srcObject;
    recordedChunks = [];

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        recording.src = url;
        recording.style.display = "block";
        recording.play();

        downloadButton.href = url;
        downloadButton.download = "RecordedVideo.webm";
        downloadButton.style.display = "inline-block";
    };

    mediaRecorder.start();

    startButton.style.display = "none";
    stopButton.style.display = "inline-block";
});

stopButton.addEventListener("click", () => {
    mediaRecorder.stop();
    stopButton.style.display = "none";
    preview.style.display = "none";
});
