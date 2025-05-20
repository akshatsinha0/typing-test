import React, { useState, useEffect, useRef } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { motion } from 'framer-motion';
import { ThemeProvider } from './theme/ThemeProvider';
import { Typography } from './core/components/atoms/Typography';
import { Button } from './core/components/atoms/Button';
import { TypingTestDisplay } from './features/typing-test/components/TypingTestDisplay';
import { useTextGenerator } from './features/typing-test/hooks/useTextGenerator';
import { AnimatedBackground } from './theme/AnimatedBackground';
import { generateInfiniteText } from './services/dynamicTextService';
import type { TestConfig, TestResult, ComplexityLevel } from './core/types';

// Fallback content
const fallbackText = `The quick brown fox jumps over the lazy dog. Programming combines logic and creativity to solve problems through code. Modern development requires understanding algorithms, data structures, and system design principles.`;

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
    --elevation-1: 0 4px 20px rgba(0, 0, 0, 0.15);
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
    overflow-x: hidden;
  }
`;

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  z-index: 2;
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

// Fix for deprecated motion() - use motion.create() instead
const MainComponent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 0;
`;

const MotionMain = motion.create(MainComponent);

const SettingsPanel = styled.div`
  background: var(--foreground);
  border-radius: 12px;
  padding: 2rem;
  margin: 1rem auto;
  width: 100%;
  box-shadow: var(--elevation-1);
`;

const PresetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ModeButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
`;

const ComplexityIndicator = styled.div<{ $level: ComplexityLevel }>`
  height: 4px;
  background: ${props => {
    switch(props.$level) {
      case 'easy': return 'var(--success)';
      case 'medium': return 'var(--accent)';
      case 'hard': return 'var(--error)';
    }
  }};
  width: ${props => {
    switch(props.$level) {
      case 'easy': return '33%';
      case 'medium': return '66%';
      case 'hard': return '100%';
    }
  }};
  transition: all 0.3s ease;
`;

const LanguageSelect = styled.select`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--foreground);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: var(--font-family);
  width: 100%;
  max-width: 300px;
  margin: 1rem auto;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--accent);
  }

  option {
    background: var(--foreground);
    color: var(--text-primary);
  }
`;

const ResultsCard = styled.div`
  background: var(--foreground);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: var(--elevation-1);
  max-width: 800px;
  margin: 1.5rem auto;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--accent);
  }
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const ResultItem = styled.div`
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
`;

// Updated AnimatedBackground component
const AnimatedBackgroundStyles = createGlobalStyle`
  .animated-bg-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    z-index: 0;
  }
  
  .floating-bubble {
    position: absolute;
    background: linear-gradient(to right, rgba(93, 71, 113, 0.2), rgb(0, 255, 0));
    filter: blur(16px);
    opacity: 0.2;
  }
`;

const App: React.FC = () => {
  const { generateText, isGenerating: isApiGenerating, error } = useTextGenerator();
  const textController = useRef(new AbortController());
  const [isGenerating, setIsGenerating] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  
  const [config, setConfig] = useState<TestConfig>({
    mode: 'time',
    timePreset: 60,
    wordPreset: 50,
    language: 'english',
    textComplexity: 'medium',
    punctuation: true,
    numbers: false,
    caseSensitive: true,
    timeAttackMode: false
  });

  const [dynamicText, setDynamicText] = useState(fallbackText);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTestActive, setIsTestActive] = useState(false);

  const startNewTest = async () => {
    textController.current.abort();
    textController.current = new AbortController();
    setIsGenerating(true);
    
    try {
      let text;
      if (config.mode === 'time') {
        text = await generateInfiniteText(
          codeLanguage,
          config.textComplexity,
          textController.current.signal
        );
      } else {
        text = await generateText(
          config.mode === 'code' ? 'code' : 'text', 
          codeLanguage
        );
      }
      
      setDynamicText(text || fallbackText);
      setTestResult(null);
      setIsTestActive(true);
    } catch (err) {
      console.error("Failed to generate text:", err);
      setDynamicText(fallbackText);
      setTestResult(null);
      setIsTestActive(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestComplete = (result: TestResult) => {
    textController.current.abort();
    setTestResult(result);
    setIsTestActive(false);
  };

  const handlePresetSelect = (type: 'time' | 'words' | 'code', value?: number) => {
    setConfig(prev => ({
      ...prev,
      mode: type,
      timePreset: type === 'time' && value ? value : prev.timePreset,
      wordPreset: type === 'words' && value ? value : prev.wordPreset
    }));
  };

  const handleComplexityChange = (level: ComplexityLevel) => {
    setConfig(prev => ({ ...prev, textComplexity: level }));
  };

  useEffect(() => {
    return () => textController.current.abort();
  }, []);

  return (
    <ThemeProvider>
      <GlobalStyle />
      <AnimatedBackgroundStyles />
      <AnimatedBackground />
      
      <AppContainer>
        <Header>
          <Logo>
            <span>DevTyper</span>
          </Logo>
        </Header>

        <MotionMain 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h2" align="center" gutterBottom>
            Master Typing Through Practice
          </Typography>
          
          <Typography variant="body1" align="center" color="var(--text-secondary)" gutterBottom>
            Enhance your coding speed and accuracy with AI-generated challenges
          </Typography>

          {!isTestActive && (
            <SettingsPanel>
              <Typography variant="h5" align="center" gutterBottom>
                Select Test Mode
              </Typography>
              
              <ModeButtonGroup>
                <Button 
                  onClick={() => handlePresetSelect('time')}
                  variant={config.mode === 'time' ? 'primary' : 'ghost'}
                >
                  Time Attack
                </Button>
                <Button 
                  onClick={() => handlePresetSelect('words')}
                  variant={config.mode === 'words' ? 'primary' : 'ghost'}
                >
                  Word Sprint
                </Button>
                <Button 
                  onClick={() => handlePresetSelect('code')}
                  variant={config.mode === 'code' ? 'primary' : 'ghost'}
                >
                  Code
                </Button>
              </ModeButtonGroup>
              
              {config.mode === 'time' && (
                <PresetGrid>
                  <div>
                    <Typography variant="h5" gutterBottom>Duration</Typography>
                    {[30, 60, 120, 300].map(time => (
                      <Button
                        key={time}
                        variant={config.timePreset === time ? 'primary' : 'ghost'}
                        onClick={() => handlePresetSelect('time', time)}
                      >
                        {time}s
                      </Button>
                    ))}
                  </div>
                </PresetGrid>
              )}
              
              {config.mode === 'words' && (
                <PresetGrid>
                  <div>
                    <Typography variant="h5" gutterBottom>Word Count</Typography>
                    {[50, 100, 200, 500].map(words => (
                      <Button
                        key={words}
                        variant={config.wordPreset === words ? 'primary' : 'ghost'}
                        onClick={() => handlePresetSelect('words', words)}
                      >
                        {words} words
                      </Button>
                    ))}
                  </div>
                </PresetGrid>
              )}

              {config.mode === 'code' && (
                <div style={{ margin: '1.5rem 0', textAlign: 'center' }}>
                  <Typography variant="h5" gutterBottom>Programming Language</Typography>
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
                </div>
              )}

              <div>
                <Typography variant="h5" gutterBottom>Challenge Level</Typography>
                <div style={{ marginBottom: '1rem' }}>
                  {(['easy', 'medium', 'hard'] as ComplexityLevel[]).map(level => (
                    <Button
                      key={level}
                      variant={config.textComplexity === level ? 'primary' : 'ghost'}
                      onClick={() => handleComplexityChange(level)}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
                <ComplexityIndicator $level={config.textComplexity} />
              </div>

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Button 
                  size="lg"
                  onClick={startNewTest}
                  loading={isGenerating || isApiGenerating}
                  disabled={isGenerating || isApiGenerating}
                >
                  {isGenerating || isApiGenerating ? 'Preparing Challenge...' : 'Start Typing Test'}
                </Button>
                {error && (
                  <Typography variant="body2" color="var(--error)" style={{ marginTop: '0.5rem' }}>
                    {error}
                  </Typography>
                )}
              </div>
            </SettingsPanel>
          )}

          {isTestActive && (
            <TypingTestDisplay
              config={config}
              text={dynamicText}
              onComplete={handleTestComplete}
            />
          )}

          {testResult && (
            <ResultsCard>
              <Typography variant="h3" gutterBottom>Performance Analysis</Typography>
              
              <ResultsGrid>
                <ResultItem>
                  <Typography variant="caption">Speed (WPM)</Typography>
                  <Typography variant="h2" color="var(--accent)">
                    {testResult.wpm}
                  </Typography>
                  <Typography variant="caption" color="var(--text-secondary)">
                    Raw: {testResult.rawWpm?.toFixed(1) || testResult.wpm}
                  </Typography>
                </ResultItem>

                <ResultItem>
                  <Typography variant="caption">Accuracy</Typography>
                  <Typography variant="h2" color="var(--success)">
                    {testResult.accuracy}%
                  </Typography>
                  <Typography variant="caption" color="var(--text-secondary)">
                    Errors: {testResult.incorrectChars}
                  </Typography>
                </ResultItem>

                <ResultItem>
                  <Typography variant="caption">Confidence</Typography>
                  <Typography variant="h2" color="var(--accent)">
                    {(testResult.physics?.confidence * 100 || 0).toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="var(--text-secondary)">
                    Consistency Score
                  </Typography>
                </ResultItem>

                <ResultItem>
                  <Typography variant="caption">Burst Speed</Typography>
                  <Typography variant="h2">
                    {testResult.physics?.burstSpeed && testResult.physics.burstSpeed.length > 0
                      ? Math.max(...testResult.physics.burstSpeed).toFixed(1)
                      : "0.0"
                    }
                  </Typography>
                  <Typography variant="caption" color="var(--text-secondary)">
                    Peak Performance
                  </Typography>
                </ResultItem>

                <ResultItem>
                  <Typography variant="caption">Complexity</Typography>
                  <Typography variant="h2" color="var(--error)">
                    {testResult.textComplexity || config.textComplexity}
                  </Typography>
                  <Typography variant="caption" color="var(--text-secondary)">
                    Challenge Level
                  </Typography>
                </ResultItem>
              </ResultsGrid>

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Button onClick={startNewTest} size="lg">
                  Try Again
                </Button>
              </div>
            </ResultsCard>
          )}
        </MotionMain>
      </AppContainer>
    </ThemeProvider>
  );
};

export default App;
