import React, { useState, useEffect, useRef, forwardRef } from 'react';
import toast from 'react-hot-toast';
import {
  Box,
  TextField,
  Typography,
  Chip,
  Tooltip
} from '@mui/material';
import { Code as CodeIcon } from '@mui/icons-material';

const PromptEditor = forwardRef(({ 
  value, 
  onChange, 
  placeholder = "AI 분석을 위한 프롬프트를 입력하세요...",
  rows = 20,
  label = "프롬프트 내용",
  interpolationVariables = [],
  showUsedVariables = true,
  onVariableClick = null,
  currentPositions = {},
  ...props 
}, ref) => {
  const textFieldRef = useRef(null);
  const highlightRef = useRef(null);

  // ref를 외부와 내부 모두에서 사용할 수 있도록 처리
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(textFieldRef.current);
      } else {
        ref.current = textFieldRef.current;
      }
    }
  }, [ref]);

  // 인터폴레이션 변수 패턴 생성
  const variablePatterns = interpolationVariables.map(v => v.variable);

  // 하이라이트 업데이트
  useEffect(() => {
    updateHighlights();
  }, [value, variablePatterns]);

  // 스크롤 동기화 및 위치 동기화
  useEffect(() => {
    const textField = textFieldRef.current?.querySelector('textarea');
    if (!textField || !highlightRef.current) return;

    const syncPosition = () => {
      if (highlightRef.current && textField) {
        // 실제 textarea의 스타일 가져오기
        const computedStyle = window.getComputedStyle(textField);
        const rect = textField.getBoundingClientRect();
        const containerRect = textFieldRef.current.getBoundingClientRect();
        
        // 오버레이에 동일한 스타일 적용
        highlightRef.current.style.paddingTop = computedStyle.paddingTop;
        highlightRef.current.style.paddingRight = computedStyle.paddingRight;
        highlightRef.current.style.paddingBottom = computedStyle.paddingBottom;
        highlightRef.current.style.paddingLeft = computedStyle.paddingLeft;
        highlightRef.current.style.fontSize = computedStyle.fontSize;
        highlightRef.current.style.lineHeight = computedStyle.lineHeight;
        highlightRef.current.style.fontFamily = computedStyle.fontFamily;
        
        // textarea의 정확한 위치 계산
        const topOffset = rect.top - containerRect.top;
        const leftOffset = rect.left - containerRect.left;
        
        highlightRef.current.style.top = `${topOffset}px`;
        highlightRef.current.style.left = `${leftOffset}px`;
        highlightRef.current.style.width = `${rect.width}px`;
        highlightRef.current.style.height = `${rect.height}px`;
        
        // 스크롤 위치 동기화
        highlightRef.current.scrollTop = textField.scrollTop;
        highlightRef.current.scrollLeft = textField.scrollLeft;
      }
    };

    const handleScroll = () => {
      if (highlightRef.current) {
        highlightRef.current.scrollTop = textField.scrollTop;
        highlightRef.current.scrollLeft = textField.scrollLeft;
      }
    };

    // 초기 위치 동기화
    syncPosition();
    
    textField.addEventListener('scroll', handleScroll);
    
    // 리사이즈 감지를 위한 ResizeObserver
    const resizeObserver = new ResizeObserver(syncPosition);
    resizeObserver.observe(textField);
    
    return () => {
      textField.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  const updateHighlights = () => {
    if (!highlightRef.current || !value || variablePatterns.length === 0) {
      if (highlightRef.current) {
        highlightRef.current.innerHTML = '';
      }
      return;
    }

    let highlightedText = value;
    
    // HTML 특수문자 이스케이프
    highlightedText = highlightedText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    // 각 변수를 하이라이트
    variablePatterns.forEach(variable => {
      const escapedVariable = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedVariable})`, 'g');
      highlightedText = highlightedText.replace(regex, 
        `<span style="background-color: rgba(240, 147, 251, 0.3); border-radius: 3px;">$1</span>`
      );
    });

    // 줄바꿈을 <br>로 변환
    highlightedText = highlightedText.replace(/\n/g, '<br>');

    highlightRef.current.innerHTML = highlightedText;

    // 스크롤 위치 동기화
    const textField = textFieldRef.current?.querySelector('textarea');
    if (textField) {
      highlightRef.current.scrollTop = textField.scrollTop;
      highlightRef.current.scrollLeft = textField.scrollLeft;
    }
  };

  // 변수 클릭 핸들러
  const handleVariableClick = (variable) => {
    if (onVariableClick) {
      onVariableClick(variable);
      return;
    }

    // 기본 동작 (외부 핸들러가 없을 때)
    if (!textFieldRef.current) return;
    
    const textField = textFieldRef.current.querySelector('textarea');
    if (!textField) return;

    const positions = [];
    let index = 0;
    while ((index = value.indexOf(variable, index)) !== -1) {
      positions.push(index);
      index += variable.length;
    }

    if (positions.length === 0) return;

    // 현재 변수의 위치 인덱스 가져오기 (없으면 0)
    const currentIndex = currentPositions[variable] || 0;
    const nextIndex = (currentIndex + 1) % positions.length;
    
    const position = positions[nextIndex];
    textField.focus();
    textField.setSelectionRange(position, position + variable.length);
    
    // 스크롤 위치 계산 및 이동
    const lines = value.substring(0, position).split('\n');
    const lineNumber = lines.length - 1;
    const lineHeight = 21;
    const scrollTop = Math.max(0, (lineNumber * lineHeight) - (textField.clientHeight / 2));
    
    textField.scrollTop = scrollTop;

    // 토스트 알림
    if (positions.length > 1) {
      toast.success(`${variable} 변수 (${nextIndex + 1}/${positions.length})로 이동했습니다.`, {
        duration: 2000,
        style: {
          background: '#10b981',
          color: 'white',
        },
      });
    }
  };

  return (
    <Box>
      {/* 텍스트 필드와 하이라이트 오버레이 컨테이너 */}
      <Box sx={{ position: 'relative' }}>
        {/* 하이라이트 오버레이 */}
        <Box
          ref={highlightRef}
          sx={{
            position: 'absolute',
            // 초기 위치는 JavaScript에서 동적으로 설정
            pointerEvents: 'none',
            color: 'transparent',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflow: 'auto',
            zIndex: 10, // z-index를 높여서 앞으로 가져오기
            // 스크롤바 숨기기
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
          }}
        />

        {/* 실제 텍스트 필드 */}
        <TextField
          ref={textFieldRef}
          fullWidth
          multiline
          rows={rows}
          variant="outlined"
          label={label}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          sx={{
            position: 'relative',
            zIndex: 5,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.8)',
              fontFamily: 'monospace',
            },
            '& .MuiInputBase-input': {
              color: 'rgba(0, 0, 0, 0.87)',
              caretColor: 'rgba(0, 0, 0, 0.87)',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.5',
              background: 'transparent',
              borderRadius: '4px',
            },
            '& .MuiInputLabel-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '0 4px',
              zIndex: 15,
            },
            '& .MuiInputLabel-shrink': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '0 4px',
              zIndex: 15,
            }
          }}
          {...props}
        />
      </Box>
      
      {/* 변수 목록 표시 */}
      {showUsedVariables && interpolationVariables.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            사용된 변수:
          </Typography>
          {variablePatterns.map(variable => {
            const count = (value.match(new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            if (count === 0) return null;
            
            return (
              <Tooltip key={variable} title={`${count}번 사용됨`} arrow>
                <Chip
                  label={`${variable} (${count})`}
                  size="small"
                  variant="outlined"
                  color="primary"
                  icon={<CodeIcon />}
                  onClick={() => handleVariableClick(variable)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      color: 'white'
                    }
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      )}
    </Box>
  );
});

// 사용된 변수만 표시하는 별도 컴포넌트
export const UsedVariables = ({ value = '', interpolationVariables = [], onVariableClick, currentPositions = {} }) => {
  const variablePatterns = interpolationVariables.map(v => v.variable);
  
  const handleVariableClick = (variable) => {
    if (onVariableClick) {
      onVariableClick(variable);
      return;
    }

    // 기본 동작 (외부 핸들러가 없을 때)
    const positions = [];
    let index = 0;
    while ((index = value.indexOf(variable, index)) !== -1) {
      positions.push(index);
      index += variable.length;
    }

    if (positions.length === 0) return;

    const currentIndex = currentPositions[variable] || 0;
    const nextIndex = (currentIndex + 1) % positions.length;

    if (positions.length > 1) {
      toast.success(`${variable} 변수 (${nextIndex + 1}/${positions.length})로 이동했습니다.`, {
        duration: 2000,
        style: {
          background: '#10b981',
          color: 'white',
        },
      });
    }
  };
  
  return (
    <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
        사용된 변수:
      </Typography>
      {variablePatterns.map(variable => {
        const count = (value.match(new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        if (count === 0) return null;
        
        const currentIndex = currentPositions[variable] || 0;
        const positions = [];
        let index = 0;
        while ((index = value.indexOf(variable, index)) !== -1) {
          positions.push(index);
          index += variable.length;
        }
        
        return (
          <Tooltip key={variable} title={`${count}번 사용됨 - 클릭하여 이동 ${positions.length > 1 ? `(현재: ${currentIndex + 1}/${positions.length})` : ''}`} arrow>
            <Chip
              label={`${variable} (${count})`}
              size="small"
              variant="outlined"
              color="primary"
              icon={<CodeIcon />}
              onClick={() => handleVariableClick(variable)}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white'
                }
              }}
            />
          </Tooltip>
        );
      })}
      {variablePatterns.filter(variable => 
        (value.match(new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length > 0
      ).length === 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          사용된 변수가 없습니다
        </Typography>
      )}
    </Box>
  );
};

export default PromptEditor; 