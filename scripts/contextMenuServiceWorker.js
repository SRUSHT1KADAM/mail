const getKey = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['openai-key'], (result) => {
            if (result['openai-key']) {
                const decodedKey = atob(result['openai-key']);
                resolve(decodedKey);
            }
        });
    });
};

const sendMessage = (content) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0].id;
        let url = tabs[0].url;
        console.log(url);  
        let site;
        if (url.includes("mail.google")) {
            site = "gmail";
        }
        else if (url.includes("outlook")) {
            site = "outlook";
        }

        chrome.tabs.sendMessage(
            activeTab,
            { message: site, content },
            (response) => {
                if (response.status === 'failed') {
                    console.log('injection failed.');
                } 
            }
        ); 
    });
};

const generate = async (prompt) => {
    const key = await getKey();
    const url = 'https://api.openai.com/v1/completions';

    const completionResponse = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'text-davinci-003',
            prompt: prompt,
            max_tokens: 500,
            temperature: 0.7,
        }),
    });

    const completion = await completionResponse.json();
    return completion.choices.pop();
}
const generateCompletionAction = async (info) => {
    try {
        sendMessage('generating...');
        const { selectionText } = info || {};
        const basePromptPrefix = `Without including the subject line, write me an email template based off the subject line of "`;

        const baseCompletion = await generate(`${basePromptPrefix}${selectionText}"\n`);
        let text = baseCompletion.text;
        sendMessage(text.substring(1));
    } catch (error) {
        console.log(error);
        sendMessage(error.toString());
    } 
};

const openvoicepage = () => {chrome.tabs.create({ url: "http://127.0.0.1:5500/voice.html" });};

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'context-run',
        title: 'Generate email',
        contexts: ['selection'], 
    }); 
chrome.contextMenus.create({
    title: "Voice Assistant",
    id: "voiceAssistant",
    contexts: ["all"], 
  });
});
 


//chrome.contextMenus.onClicked.addListener(generateCompletionAction);
//chrome.contextMenus.onClicked.addListener(openvoicepage);

// Add a listener for the context menu item clicks
chrome.contextMenus.onClicked.addListener(function(inf, tab) {
  // Check the menuItemId to determine which menu item was clicked
  switch (inf.menuItemId) {
    case "context-run":
      // Handle the click for Menu Item 1
          generateCompletionAction();
      // Add your logic here for Menu Item 1
      break;
    case "voiceAssistant":
      // Handle the click for Menu Item 2
          openvoicepage();
      // Add your logic here for Menu Item 2
      break;
      default:
          generateCompletionAction();
  }
});