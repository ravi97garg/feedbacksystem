const preview = document.getElementById("preview");
const recording = document.getElementById("recording");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
// const downloadButton = document.getElementById("downloadButton");
const detailsOverlay = document.getElementById("detailsOverlay");

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
    detailsOverlay.style.display = "initial";
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
    name: "Recording-" + issueDate.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric"
    }) + " " + issueDate.getHours() + "-" + issueDate.getMinutes(),
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
  return `https://drive.google.com/file/d/${data.id}/view`
  // alert('File uploaded with ID: ' + `https://drive.google.com/file/d/${data.id}/view`);
}

document.getElementById("uploadButton").addEventListener("click", async () => {
  const file = recordedVideo;
  const name = document.querySelector('input[name="name"]').value;
  const phone = document.querySelector('input[name="phone"]').value;
  const description = document.querySelector('textarea[name="description"]').value;
  if (!file) return alert("Please select a video first.");
  if(!name || !phone) {
    return alert("Please fill the mandatory fields.");
  }

  await handleAuth();
  const id = Math.random().toString(16).slice(10);
  const issueLink = await uploadFile(file);
  const params = new URLSearchParams(window.location.search);
  const location = params.get('location'); // "basement"
  emailjs.send(
    'service_sxni04o',
    'template_ozgrdxc',
    {
      id: id,
      issueDate: new Date().toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric"
      }),
      name,
      description,
      phone,
      issueLink,
      location,
      email: 'krishnanand.agb@gmail.com, harekrsna1896@gmail.com'
    },
    'Pend9MkbK8Ra8f1Gi'
  );
  detailsOverlay.style.display = "none";
  alert(`Thank you. We've raised your concern to concerned management team. Kindly note your issue ID #${id} for future reference.`)
});

gapiInit();
