import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { ThemeProvider } from './theme/ThemeProvider';
import { Typography } from './core/components/atoms/Typography';
import { Button } from './core/components/atoms/Button';
import { TypingTestDisplay } from './features/typing-test/components/TypingTestDisplay';
import { useTextGenerator } from './features/typing-test/hooks/useTextGenerator';
import type { TestConfig, TestResult } from './core/types';

// Fallback sample text in case API fails
const fallbackText = `The quick brown fox jumps over the lazy dog. Programming is the process of creating a set of instructions that tell a computer how to perform a task. Programming can be done using a variety of computer programming languages, such as JavaScript, Python, and C++. The art of programming lies in organizing your logic into meaningful steps that a computer can interpret.`;

const GlobalStyle = createGlobalStyle`
  :root {
    --background: #232323;
    --foreground: #323232;
    --caret: #00cc88;
    --accent: #00cc88;
    --accent-rgb: 0, 204, 136;
    --error: #f44336;
    --error-rgb: 244, 67, 54;
    --success: #4caf50;
    --text-primary: #e0e0e0;
    --text-secondary: #9e9e9e;
    --font-family: 'Roboto Mono', monospace;
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: var(--font-family);
    background-color: var(--background);
    color: var(--text-primary);
    line-height: 1.6;
  }
`;

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 2rem;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
  display: flex;
  align-items: center;
  
  span {
    display: inline-block;
    margin-left: 0.5rem;
  }
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const SettingsBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ContentTypeBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const LanguageSelect = styled.select`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background-color: var(--foreground);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: var(--font-family);
  margin-bottom: 1.5rem;
  max-width: 200px;
  margin: 0 auto 1.5rem;
`;

const ErrorMessage = styled.div`
  color: var(--error);
  text-align: center;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: rgba(244, 67, 54, 0.1);
  border-radius: 6px;
  max-width: 600px;
  margin: 0 auto 1.5rem;
`;

const ResultsCard = styled.div`
  background-color: var(--foreground);
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 900px;
  margin: 2rem auto;
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const ResultItem = styled.div`
  text-align: center;
`;

const App: React.FC = () => {
  // Text generator hook
  const { generateText, isGenerating, error } = useTextGenerator();
  
  // Test content state
  const [generatedText, setGeneratedText] = useState<string>(fallbackText);
  const [contentType, setContentType] = useState<'text' | 'code'>('text');
  const [codeLanguage, setCodeLanguage] = useState<string>('javascript');
  
  // Test configuration state
  const [config, setConfig] = useState<TestConfig>({
    mode: 'time',
    duration: 60,
    wordCount: 50,
    language: 'english',
    difficulty: 'normal',
    punctuation: true,
    numbers: false,
    caseSensitive: true,
  });
  
  // Test state
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTestActive, setIsTestActive] = useState(false);
  
  // Handle test completion
  const handleTestComplete = (result: TestResult) => {
    setTestResult(result);
    setIsTestActive(false);
  };
  
  // Start new test with AI-generated content
  const startNewTest = async () => {
    try {
      const newText = await generateText(
        contentType, 
        contentType === 'code' ? codeLanguage : undefined
      );
      setGeneratedText(newText);
      setTestResult(null);
      setIsTestActive(true);
    } catch { 
      // Error handling done in the hook
      // Use fallback text if generation fails
      setGeneratedText(fallbackText);
      setTestResult(null);
      setIsTestActive(true);
    }
  };
  
  // Change test mode
  const changeTestMode = (mode: TestConfig['mode']) => {
    setConfig(prev => ({ ...prev, mode }));
    setTestResult(null);
  };
  
  // Change content type (text/code)
  const handleContentTypeChange = (type: 'text' | 'code') => {
    setContentType(type);
    // Update test mode based on content type
    if (type === 'code') {
      setConfig(prev => ({ 
        ...prev, 
        mode: 'words',
        wordCount: 50
      }));
    }
  };

  return (
    <ThemeProvider>
      <GlobalStyle />
      <AppContainer>
        <Header>
          <Logo>
            <span>DevTyper</span>
          </Logo>
          <div>
            {/* This would be a theme switcher or other controls */}
          </div>
        </Header>
        
        <Main>
          <Typography variant="h2" align="center" gutterBottom>
            Improve Your Typing Skills
          </Typography>
          <Typography variant="body1" align="center" color="var(--text-secondary)" gutterBottom>
            Test your typing speed, accuracy, and improve your coding productivity.
          </Typography>
          
          <SettingsBar>
            <Button 
              onClick={() => changeTestMode('time')}
              variant={config.mode === 'time' ? 'primary' : 'ghost'}
            >
              Time
            </Button>
            <Button 
              onClick={() => changeTestMode('words')}
              variant={config.mode === 'words' ? 'primary' : 'ghost'}
            >
              Words
            </Button>
            <Button 
              onClick={() => changeTestMode('quote')}
              variant={config.mode === 'quote' ? 'primary' : 'ghost'}
            >
              Quote
            </Button>
          </SettingsBar>
          
          {isTestActive ? (
            <TypingTestDisplay
              config={config}
              text={generatedText}
              onComplete={handleTestComplete}
            />
          ) : testResult ? (
            <ResultsCard>
              <ResultsHeader>
                <Typography variant="h3">Test Results</Typography>
                <Button onClick={startNewTest} loading={isGenerating}>
                  Try Again
                </Button>
              </ResultsHeader>
              
              <ResultsGrid>
                <ResultItem>
                  <Typography variant="caption">WPM</Typography>
                  <Typography variant="h2" color="var(--accent)">
                    {testResult.wpm}
                  </Typography>
                </ResultItem>
                
                <ResultItem>
                  <Typography variant="caption">Accuracy</Typography>
                  <Typography variant="h2" color="var(--success)">
                    {testResult.accuracy}%
                  </Typography>
                </ResultItem>
                
                <ResultItem>
                  <Typography variant="caption">Time</Typography>
                  <Typography variant="h3">
                    {Math.floor(testResult.duration)}s
                  </Typography>
                </ResultItem>
                
                <ResultItem>
                  <Typography variant="caption">Characters</Typography>
                  <Typography variant="h3">
                    {testResult.correctChars}/{testResult.totalChars}
                  </Typography>
                </ResultItem>
              </ResultsGrid>
            </ResultsCard>
          ) : (
            <>
              {error && (
                <ErrorMessage>
                  <Typography variant="body2" color="var(--error)">
                    Error: {error}
                  </Typography>
                </ErrorMessage>
              )}
              
              <ContentTypeBar>
                <Button 
                  onClick={() => handleContentTypeChange('text')}
                  variant={contentType === 'text' ? 'primary' : 'ghost'}
                >
                  General Text
                </Button>
                <Button 
                  onClick={() => handleContentTypeChange('code')}
                  variant={contentType === 'code' ? 'primary' : 'ghost'}
                >
                  Code
                </Button>
              </ContentTypeBar>
              
              {contentType === 'code' && (
                <LanguageSelect 
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="c++">C++</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="ruby">Ruby</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                </LanguageSelect>
              )}
              
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Button 
                  size="lg" 
                  onClick={startNewTest}
                  loading={isGenerating}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating Content...' : 'Start Typing Test'}
                </Button>
              </div>
            </>
          )}
        </Main>
      </AppContainer>
    </ThemeProvider>
  );
};

export default App;
