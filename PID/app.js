// notice: do not use the keys for any other projects
// pillow's supabase keys
const supabaseUrl = "https://cjiqkmcobejlgjkttnbd.supabase.co";
const supabaseKey = "sb_publishable_h6v9FiL6VyI_-EZGrWV6LQ_Ee7w_PCj";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// toggle mode
let mode = "online"; // "online" = supabase, "local" = local_data.json

function toggleMode() {
  mode = mode === "online" ? "local" : "online";
  loadApps();
  alert("mode: " + mode);
}

// render a single app
function renderApp(app) {
  return `<div class='app'>
    <b>${app.name}</b> v${app.version}<br>
    ${app.description}<br>
    <a href='${app.download_url}' target="_blank">download</a>
  </div>`;
}

// load apps
async function loadApps() {
  const el = document.getElementById("apps");
  if (!el) return;
  el.innerHTML = "";

  if (mode === "online") {
    const { data, error } = await supabase.from("pid_index").select("*").order("created_at", { ascending:false });
    if (error || !data) {
      console.log("supabase error:", error);
      el.innerHTML = "<p>Failed to load online apps, fallback to local</p>";
      mode = "local";
      return loadApps();
    }
    data.forEach(app => { el.innerHTML += renderApp(app); });
  } else {
    // local fallback
    try {
      const res = await fetch("local_data.json");
      const localApps = await res.json();
      localApps.forEach(app => { el.innerHTML += renderApp(app); });
    } catch(err) {
      el.innerHTML = "<p>Failed to load local apps</p>";
      console.log(err);
    }
  }
}

// GitHub login
async function login() {
  const { error } = await supabase.auth.signInWithOAuth({ provider: "github" });
  if (error) console.log("login error:", error);
}

// upload app
async function uploadApp() {
  const name = document.getElementById("name").value;
  const version = document.getElementById("version").value;
  const desc = document.getElementById("desc").value;
  const file = document.getElementById("file").files[0];

  if (!file) return alert("select a file");
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return alert("please login first");

  const path = `${name}/${version}/${file.name}`;
  await supabase.storage.from("pid-apps").upload(path, file);
  const url = supabase.storage.from("pid-apps").getPublicUrl(path).data.publicUrl;

  await supabase.from("pid_index").insert({
    name: name,
    version: version,
    description: desc,
    download_url: url,
    owner_id: user.id
  });

  alert("uploaded");
  loadApps();
}

