<script>
  import { Button, Card, CardBody, CardTitle, Input, FormGroup, Label, Alert, Nav, NavItem, NavLink } from 'sveltestrap';
  import { onMount } from 'svelte';
  
  let prompt = '';
  let messages = [];
  let error = '';
  let activeTab = 'practice';  // Set practice as default
  let synth;
  let voices = [];

  onMount(() => {
    synth = window.speechSynthesis;
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    window.speakText = speak;
  });

  function loadVoices() {
    voices = synth.getVoices().filter(voice => voice.lang.startsWith('fr'));
  }

  function speak(text) {
    if (!synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (voices.length > 0) {
      utterance.voice = voices[0];
    }
    utterance.lang = 'fr-FR';
    synth.speak(utterance);
  }

  function setActiveTab(tab) {
    activeTab = tab;
    messages = [];
    error = '';
    prompt = '';
  }

  function formatMessage(content) {
    if (activeTab === 'practice') {
      content = content.replace(
        /(🇫🇷.*?[.!?])/g,
        (match) => `${match}<button class="inline-speak-button" onclick="window.speakText('${match.replace(/🇫🇷[: ]+/, '').replace(/'/g, "\\'")}')" title="Listen">🔊</button>`
      );
    } else if (activeTab === 'vocabulary') {
      content = content.replace(
        /(🔊 Pronunciation:.*?)(?=\n|$)/g,
        (match) => `${match}<button class="inline-speak-button" onclick="window.speakText('${match.replace(/🔊 Pronunciation: /, '').replace(/'/g, "\\'")}')" title="Listen">🔊</button>`
      );
    }

    if (activeTab === 'practice') {
      content = content.replace(/(🌍 English:.*?)(?=\n|$)/g, '<div class="translation-section english">$1</div>');
      content = content.replace(/(🇫🇷 French:.*?)(?=\n|$)/g, '<div class="translation-section french">$1</div>');
      content = content.replace(/(✍️ Grammar Check:)(.*?)(?=\n[🌍🇫🇷💭]|$)/gs, '<div class="grammar-section">$1$2</div>');
      content = content.replace(/(💭 Response in both languages:)/g, '<div class="response-header">$1</div>');
      content = content.replace(/(🇫🇷:.*?)(?=\n|$)/g, '<div class="response-section french">$1</div>');
      content = content.replace(/(🌍:.*?)(?=\n|$)/g, '<div class="response-section english">$1</div>');
    } else {
      content = content.replace(/(\d+\.\s+[^:]+):/g, '<div class="section-header">$1:</div>');
      content = content.replace(/^[•-]\s+(.+)$/gm, '<li>$1</li>');
      content = content.replace(/(<li>.*?<\/li>)/gs, '<ul class="custom-list">$1</ul>');
      content = content.replace(/(🔹 Original:.*?)\n/g, '<div class="correction original">$1</div>\n');
      content = content.replace(/(✨ Corrected:.*?)\n/g, '<div class="correction corrected">$1</div>\n');
      content = content.replace(/(📝|🔊|🌍|📚|💡|✍️|🎨)\s+([^:]+):/g, '<div class="emoji-header">$1 $2:</div>');
    }
    return content;
  }

  async function getResponse() {
    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prompt,
          mode: activeTab 
        })
      });

      const data = await res.json();

      if (res.ok) {
        const formattedContent = formatMessage(data.choices[0].message.content);
        messages = [
          ...messages,
          { 
            role: 'user', 
            content: prompt
          },
          { 
            role: 'assistant', 
            content: formattedContent
          }
        ];
        prompt = '';
        error = '';
      } else {
        error = data.error || 'An error occurred';
      }
    } catch (err) {
      error = 'An error occurred while fetching the response';
    }
  }
</script>

<div class="app-container">
  <div class="container py-5">
    <Card class="main-card">
      <CardBody>
        <div class="app-header">
          <CardTitle tag="h4" class="mb-4">
            <span class="flag">🇫🇷</span> French Language Tutor
          </CardTitle>
          
          <Nav tabs class="custom-tabs">
            <NavItem>
              <NavLink 
                active={activeTab === 'practice'} 
                on:click={() => setActiveTab('practice')}
                class="tab-link"
              >
                🎯 Practice Chat
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink 
                active={activeTab === 'grammar'} 
                on:click={() => setActiveTab('grammar')}
                class="tab-link"
              >
                ✍️ Grammar Check
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink 
                active={activeTab === 'vocabulary'} 
                on:click={() => setActiveTab('vocabulary')}
                class="tab-link"
              >
                📚 Word Explorer
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink 
                active={activeTab === 'chat'} 
                on:click={() => setActiveTab('chat')}
                class="tab-link"
              >
                💡 French Tips
              </NavLink>
            </NavItem>
          </Nav>
        </div>

        <div class="chat-container mb-3">
          {#each messages as { role, content }}
            <div class={role} class:fade-in={true}>
              {#if role === 'user'}
                <div class="user-bubble">
                  <p>{content}</p>
                </div>
              {:else}
                <div class="assistant-content">
                  <div class="structured-content">
                    {@html content}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <div class="input-section">
          <FormGroup>
            <Label for="prompt" class="prompt-label">
              {#if activeTab === 'practice'}
                💭 Write in English or French - I'll help you practice!
              {:else if activeTab === 'grammar'}
                ✍️ Enter a French sentence to check...
              {:else if activeTab === 'vocabulary'}
                📚 Discover French Words & Phrases
              {:else}
                💡 Ask About French Language & Culture
              {/if}
            </Label>
            <Input
              type="textarea"
              name="text"
              id="prompt"
              rows="4"
              bind:value={prompt}
              class="custom-input mb-3"
              placeholder={
                activeTab === 'practice'
                  ? "Write in any language - I'll translate and help you improve!"
                  : activeTab === 'grammar' 
                  ? "e.g., Je suis allé au magasin hier" 
                  : activeTab === 'vocabulary'
                  ? "e.g., Enter a word to learn its meaning, usage, and cultural context"
                  : "e.g., Ask about grammar rules, expressions, or French culture"
              }
            />
          </FormGroup>

          <Button color="primary" on:click={getResponse} class="submit-button">
            {#if activeTab === 'practice'}
              🎯 Practice & Learn
            {:else if activeTab === 'grammar'}
              ✨ Check Grammar
            {:else if activeTab === 'vocabulary'}
              🔍 Explore Word
            {:else}
              💡 Get Tips
            {/if}
          </Button>
        </div>
      </CardBody>
    </Card>

    {#if error}
      <Alert color="danger" class="mt-3 custom-alert">
        {error}
      </Alert>
    {/if}
  </div>
</div>

<style>
  :global(body) {
    background: linear-gradient(-45deg, #FF9D6C, #BB4E75, #6B4E8B, #4682B4);
    background-size: 400% 400%;
    animation: gradientBG 15s ease infinite;
    min-height: 100vh;
    margin: 0;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  }

  @keyframes gradientBG {
    0% { background-position: 0% 50% }
    50% { background-position: 100% 50% }
    100% { background-position: 0% 50% }
  }

  @keyframes wave {
    0% { transform: rotate(0deg); }
    10% { transform: rotate(14deg); }
    20% { transform: rotate(-8deg); }
    30% { transform: rotate(14deg); }
    40% { transform: rotate(-4deg); }
    50% { transform: rotate(10deg); }
    60% { transform: rotate(0deg); }
    100% { transform: rotate(0deg); }
  }

  .french-text {
    position: relative;
    display: inline-block;
    padding-right: 1.5rem;
  }

  .inline-speak-button {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-size: 1em;
    opacity: 0.7;
    transition: all 0.3s ease;
  }

  .inline-speak-button:hover {
    opacity: 1;
    transform: translateY(-50%) scale(1.1);
  }

  .translation-section {
    padding: 1rem;
    margin: 0.75rem 0;
    border-radius: 12px;
    font-family: system-ui, -apple-system, sans-serif;
    backdrop-filter: blur(10px);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .translation-section:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }

  .translation-section.french {
    background: linear-gradient(to right, rgba(227, 242, 253, 0.9), rgba(187, 222, 251, 0.9));
    border-left: 4px solid #2196f3;
  }

  .translation-section.english {
    background: linear-gradient(to right, rgba(243, 249, 255, 0.9), rgba(207, 232, 252, 0.9));
    border-left: 4px solid #90caf9;
  }

  .response-header {
    color: #2c3e50;
    font-weight: 600;
    margin: 1.5rem 0 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid rgba(44, 62, 80, 0.1);
    transition: color 0.3s ease;
  }

  .grammar-section {
    background: linear-gradient(to right, rgba(255, 243, 205, 0.9), rgba(255, 238, 186, 0.9));
    border-left: 4px solid #ffc107;
    padding: 1rem;
    margin: 0.75rem 0;
    border-radius: 12px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .grammar-section:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }

  .response-section {
    padding: 1rem;
    margin: 0.75rem 0;
    border-radius: 12px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .response-section:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }

  .response-section.french {
    background: linear-gradient(to right, rgba(212, 237, 218, 0.9), rgba(195, 230, 203, 0.9));
    border-left: 4px solid #28a745;
  }

  .response-section.english {
    background: linear-gradient(to right, rgba(232, 245, 233, 0.9), rgba(220, 237, 223, 0.9));
    border-left: 4px solid #66bb6a;
  }

  .app-container {
    min-height: 100vh;
    padding: 2rem 0;
  }

  .main-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 32px !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border: none !important;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    margin: 0 1rem;
  }

  .main-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  }

  .app-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .flag {
    font-size: 1.8em;
    margin-right: 0.5rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    animation: wave 2s infinite;
    display: inline-block;
    transform-origin: 70% 70%;
  }

  .custom-tabs {
    justify-content: center;
    border: none !important;
    margin-bottom: 2rem;
    gap: 0.5rem;
  }

  :global(.tab-link) {
    color: #4a5568 !important;
    border: none !important;
    border-radius: 12px !important;
    margin: 0 0.25rem;
    padding: 0.75rem 1.25rem !important;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.9) !important;
    backdrop-filter: blur(5px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  :global(.tab-link:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  }

  :global(.tab-link.active) {
    background: linear-gradient(135deg, #BB4E75, #6B4E8B) !important;
    color: white !important;
    box-shadow: 0 4px 15px rgba(187, 78, 117, 0.3);
  }

  .assistant {
    text-align: left;
    margin-bottom: 1rem;
    animation: slideInLeft 0.3s ease-out;
  }

  @keyframes slideInRight {
    from { transform: translateX(20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideInLeft {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .user-bubble {
    display: inline-block;
    margin-left: auto;
  }

  .user-bubble p {
    padding: 1rem 1.5rem;
    border-radius: 20px;
    background: linear-gradient(135deg, #BB4E75, #6B4E8B);
    color: white;
    margin: 0;
    max-width: 80%;
    box-shadow: 0 4px 15px rgba(187, 78, 117, 0.2);
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .assistant-content {
    display: block;
    width: 100%;
  }

  .translation-section, .response-section, .grammar-section {
    max-width: 100%;
    white-space: normal;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
    margin: 0.75rem 0;
    padding: 1rem;
    border-radius: 10px;
    line-height: 1.5;
  }

  .assistant-content {
    display: block;
    width: 100%;
  }

  .translation-section, .response-section, .grammar-section {
    max-width: 100%;
    white-space: normal;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
    margin: 0.75rem 0;
    padding: 1rem;
    border-radius: 10px;
    line-height: 1.5;
  }

  .structured-content {
    display: block;
    padding: 1.25rem;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.95);
    color: #2d3748;
    margin: 0;
    width: 100%;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    word-wrap: break-word;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }

  .structured-content:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }

  .structured-content :global(.section-header) {
    font-weight: 600;
    font-size: 1.1em;
    margin: 1.5rem 0 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid rgba(187, 78, 117, 0.2);
    background: linear-gradient(135deg, #BB4E75, #6B4E8B);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block;
  }

  .structured-content :global(.emoji-header) {
    color: #4b6cb7;
    font-weight: 600;
    margin: 1rem 0 0.5rem;
  }

  .structured-content :global(.custom-list) {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }

  .structured-content :global(.custom-list li) {
    margin-bottom: 0.75rem;
    line-height: 1.5;
  }

  .input-section {
    background: rgba(255, 255, 255, 0.9);
    padding: 1.5rem;
    border-radius: 15px;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }

  .input-section:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }

  .prompt-label {
    color: #2c3e50;
    font-weight: 600;
    margin-bottom: 1rem;
    font-size: 1.1em;
    background: linear-gradient(135deg, #BB4E75, #6B4E8B);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  :global(.custom-input) {
    border-radius: 15px !important;
    border: 2px solid rgba(187, 78, 117, 0.2) !important;
    padding: 1rem !important;
    background: rgba(255, 255, 255, 0.9) !important;
    transition: all 0.3s ease;
    resize: none;
  }

  :global(.custom-input:focus) {
    border-color: #BB4E75 !important;
    box-shadow: 0 0 0 3px rgba(187, 78, 117, 0.2) !important;
    transform: translateY(-2px);
  }

  :global(.submit-button) {
    background: linear-gradient(135deg, #BB4E75, #6B4E8B) !important;
    border: none !important;
    border-radius: 12px !important;
    padding: 1rem 2rem !important;
    font-weight: 600 !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 15px rgba(187, 78, 117, 0.2) !important;
  }

  :global(.submit-button:hover) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(187, 78, 117, 0.3) !important;
    background: linear-gradient(135deg, #c95d84, #7a5c9a) !important;
  }

  .button-group {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  :global(.download-button) {
    background: linear-gradient(135deg, #90a4d4, #c1d3f9) !important;
    border: none !important;
    border-radius: 20px !important;
    padding: 0.75rem 2rem !important;
    font-weight: 600 !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 15px rgba(75, 108, 183, 0.2) !important;
  }

  :global(.download-button:hover:not(:disabled)) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(75, 108, 183, 0.3) !important;
  }

  :global(.custom-alert) {
    border-radius: 15px;
    border: none;
    background: linear-gradient(135deg, #ffedee, #ffe4e6) !important;
    color: #e53e3e !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    animation: slideInUp 0.5s ease-out;
  }

  @keyframes slideInUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .chat-container {
    height: 400px;
    overflow-y: auto;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 15px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    margin-bottom: 2rem;
    backdrop-filter: blur(10px);
    scrollbar-width: thin;
    scrollbar-color: #BB4E75 #f1f1f1;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .chat-container::-webkit-scrollbar {
    width: 8px;
  }

  .chat-container::-webkit-scrollbar-track {
    background: rgba(241, 241, 241, 0.8);
    border-radius: 4px;
  }

  .chat-container::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #BB4E75, #6B4E8B);
    border-radius: 4px;
  }

  .chat-container::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #c95d84, #7a5c9a);
  }
</style>
