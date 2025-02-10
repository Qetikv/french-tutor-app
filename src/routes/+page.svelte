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
      // Add listen button at the end of French sentences
      content = content.replace(
        /(🇫🇷.*?[.!?])/g,
        (match) => `${match}<button class="inline-speak-button" onclick="window.speakText('${match.replace(/🇫🇷[: ]+/, '').replace(/'/g, "\\'")}')" title="Listen">🔊</button>`
      );
    } else if (activeTab === 'vocabulary') {
      // Only add listen button for pronunciation sections
      content = content.replace(
        /(🔊 Pronunciation:.*?)(?=\n|$)/g,
        (match) => `${match}<button class="inline-speak-button" onclick="window.speakText('${match.replace(/🔊 Pronunciation: /, '').replace(/'/g, "\\'")}')" title="Listen">🔊</button>`
      );
    }

    if (activeTab === 'practice') {
      // Format original text and translations
      content = content.replace(/(🌍 English:.*?)(?=\n|$)/g, '<div class="translation-section english">$1</div>');
      content = content.replace(/(🇫🇷 French:.*?)(?=\n|$)/g, '<div class="translation-section french">$1</div>');
      
      // Format grammar checks
      content = content.replace(/(✍️ Grammar Check:)(.*?)(?=\n[🌍🇫🇷💭]|$)/gs, '<div class="grammar-section">$1$2</div>');
      
      // Format bilingual responses
      content = content.replace(/(💭 Response in both languages:)/g, '<div class="response-header">$1</div>');
      content = content.replace(/(🇫🇷:.*?)(?=\n|$)/g, '<div class="response-section french">$1</div>');
      content = content.replace(/(🌍:.*?)(?=\n|$)/g, '<div class="response-section english">$1</div>');
    } else {
      // Standard formatting
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
    background: linear-gradient(135deg, #6b93d6, #4b6cb7);
    min-height: 100vh;
    margin: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
    font-size: 0.8em;
    opacity: 0.6;
    transition: opacity 0.3s ease;
  }

  .inline-speak-button:hover {
    opacity: 1;
  }

  .translation-section {
    padding: 0.75rem 1rem;
    margin: 0.5rem 0;
    border-radius: 10px;
    font-family: 'Monaco', 'Consolas', monospace;
  }

  .translation-section.french {
    background-color: #e3f2fd;
    border-left: 4px solid #2196f3;
  }

  .translation-section.english {
    background-color: #f3f9ff;
    border-left: 4px solid #90caf9;
  }

  .response-header {
    color: #4b6cb7;
    font-weight: 600;
    margin: 1rem 0 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e8eef9;
  }

  .grammar-section {
    background-color: #fff3cd;
    border-left: 4px solid #ffc107;
    padding: 0.75rem 1rem;
    margin: 0.5rem 0;
    border-radius: 10px;
  }

  .response-section {
    padding: 0.75rem 1rem;
    margin: 0.5rem 0;
    border-radius: 10px;
  }

  .response-section.french {
    background-color: #d4edda;
    border-left: 4px solid #28a745;
  }

  .response-section.english {
    background-color: #e8f5e9;
    border-left: 4px solid #66bb6a;
  }

  .app-container {
    min-height: 100vh;
    padding: 2rem 0;
  }

  .main-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    border: none !important;
  }

  .app-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .flag {
    font-size: 1.5em;
    margin-right: 0.5rem;
  }

  .custom-tabs {
    justify-content: center;
    border: none !important;
    margin-bottom: 2rem;
  }

  :global(.tab-link) {
    color: #4b6cb7 !important;
    border: none !important;
    border-radius: 20px !important;
    margin: 0 0.5rem;
    padding: 0.75rem 1.5rem !important;
    transition: all 0.3s ease;
  }

  :global(.tab-link.active) {
    background-color: #4b6cb7 !important;
    color: white !important;
    box-shadow: 0 4px 15px rgba(75, 108, 183, 0.3);
  }

  .chat-container {
    height: 400px;
    overflow-y: auto;
    padding: 1rem;
    background-color: #ffffff;
    border-radius: 15px;
    border: 2px solid #e8eef9;
    margin-bottom: 2rem;
  }

  .user {
    text-align: right;
    margin-bottom: 1rem;
    animation: slideInRight 0.3s ease-out;
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
    padding: 0.75rem 1.5rem;
    border-radius: 20px;
    background: linear-gradient(135deg, #4b6cb7, #6b93d6);
    color: white;
    margin: 0;
    max-width: 80%;
    box-shadow: 0 4px 15px rgba(75, 108, 183, 0.2);
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
    background-color: #f8f9fa;
    color: #212529;
    margin: 0;
    width: 100%;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    word-wrap: break-word;
  }

  .structured-content :global(.section-header) {
    color: #4b6cb7;
    font-weight: 600;
    font-size: 1.1em;
    margin: 1.5rem 0 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e8eef9;
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
    background-color: #f8f9fa;
    padding: 1.5rem;
    border-radius: 15px;
  }

  .prompt-label {
    color: #4b6cb7;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  :global(.custom-input) {
    border-radius: 15px !important;
    border: 2px solid #e8eef9 !important;
    padding: 1rem !important;
    transition: all 0.3s ease;
  }

  :global(.custom-input:focus) {
    border-color: #4b6cb7 !important;
    box-shadow: 0 0 0 0.2rem rgba(75, 108, 183, 0.25) !important;
  }

  :global(.submit-button) {
    background: linear-gradient(135deg, #4b6cb7, #6b93d6) !important;
    border: none !important;
    border-radius: 20px !important;
    padding: 0.75rem 2rem !important;
    font-weight: 600 !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 15px rgba(75, 108, 183, 0.2) !important;
  }

  :global(.submit-button:hover) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(75, 108, 183, 0.3) !important;
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
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }

  .chat-container::-webkit-scrollbar {
    width: 8px;
  }

  .chat-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  .chat-container::-webkit-scrollbar-thumb {
    background: #4b6cb7;
    border-radius: 4px;
  }

  .chat-container::-webkit-scrollbar-thumb:hover {
    background: #6b93d6;
  }
</style>
