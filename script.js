const preview = document.getElementById("preview");
const recording = document.getElementById("recording");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const downloadButton = document.getElementById("downloadButton");

let mediaRecorder;
let recordedChunks = [];
let recordedVideo;

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
        recordedVideo = blob;
        // downloadButton.href = url;
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


const CLIENT_ID = '701095346056-ajlbsq91j0314t6hq68mstqgpkl6d3og.apps.googleusercontent.com';
  const SCOPES = 'https://www.googleapis.com/auth/drive.file';

  let tokenClient;

  function gapiInit() {
    gapi.load('client', async () => {
      await gapi.client.init({
        apiKey: 'AIzaSyCFEdluHLuuhBr4LVZG7aUtlETAyGZdAVQ', // Optional
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
      });
    });
  }

  function handleAuth() {
    return new Promise((resolve, reject) => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            reject(tokenResponse);
          } else {
            gapi.client.setToken(tokenResponse);
            resolve(tokenResponse.access_token);
          }
        },
      });
      tokenClient.requestAccessToken();
    });
  }

  async function uploadFile(file) {
    const accessToken = gapi.client.getToken().access_token;

    const issueDate = new Date();
    const metadata = {
      name: "Recording-"+issueDate.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric"
      })+" "+issueDate.getHours()+"-"+issueDate.getMinutes(),
      mimeType: "video/webm",
      parents: ['1Z2kNSd2eEfwZ98JoTVbkOfhm6zAtdP5J'], // 👈 This makes it appear in "My Drive"
      scope: 'https://www.googleapis.com/auth/drive.file'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: new Headers({ Authorization: 'Bearer ' + accessToken }),
      body: form,
    });

    const data = await res.json();
    alert('File uploaded with ID: ' + `https://drive.google.com/file/d/${data.id}/view`);
  }

  document.getElementById("uploadButton").addEventListener("click", async () => {
    const file = recordedVideo;
    if (!file) return alert("Please select a video first.");
    
    await handleAuth();
    uploadFile(file);
  });

  gapiInit();
