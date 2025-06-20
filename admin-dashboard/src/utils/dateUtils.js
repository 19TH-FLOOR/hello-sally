/**
 * 날짜 포맷팅 유틸리티 함수들
 * 모든 날짜는 한국 시간(KST)으로 변환하여 표시
 */

/**
 * UTC 시간을 한국 시간으로 변환
 * @param {string} dateString - ISO 형식의 날짜 문자열
 * @returns {Date} - 한국 시간으로 변환된 Date 객체
 */
const convertToKoreanTime = (dateString) => {
  if (!dateString) return null;
  const utcDate = new Date(dateString);
  // UTC 시간에 9시간 추가 (KST = UTC + 9)
  return new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
};

/**
 * 한국 시간으로 날짜와 시간을 포맷팅
 * @param {string} dateString - ISO 형식의 날짜 문자열
 * @returns {string} - "YYYY. MM. DD. HH:MM:SS" 형식의 문자열
 */
export const formatToKoreanDateTime = (dateString) => {
  if (!dateString) return '-';
  const koreanDate = convertToKoreanTime(dateString);
  if (!koreanDate) return '-';
  
  const year = koreanDate.getFullYear();
  const month = String(koreanDate.getMonth() + 1).padStart(2, '0');
  const day = String(koreanDate.getDate()).padStart(2, '0');
  const hours = String(koreanDate.getHours()).padStart(2, '0');
  const minutes = String(koreanDate.getMinutes()).padStart(2, '0');
  const seconds = String(koreanDate.getSeconds()).padStart(2, '0');
  
  return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
};

/**
 * 한국 시간으로 날짜만 포맷팅
 * @param {string} dateString - ISO 형식의 날짜 문자열
 * @returns {string} - "YYYY. MM. DD." 형식의 문자열
 */
export const formatToKoreanDate = (dateString) => {
  if (!dateString) return '-';
  const koreanDate = convertToKoreanTime(dateString);
  if (!koreanDate) return '-';
  
  const year = koreanDate.getFullYear();
  const month = String(koreanDate.getMonth() + 1).padStart(2, '0');
  const day = String(koreanDate.getDate()).padStart(2, '0');
  
  return `${year}. ${month}. ${day}.`;
};

/**
 * 한국 시간으로 시간만 포맷팅
 * @param {string} dateString - ISO 형식의 날짜 문자열
 * @returns {string} - "HH:MM:SS" 형식의 문자열
 */
export const formatToKoreanTime = (dateString) => {
  if (!dateString) return '-';
  const koreanDate = convertToKoreanTime(dateString);
  if (!koreanDate) return '-';
  
  const hours = String(koreanDate.getHours()).padStart(2, '0');
  const minutes = String(koreanDate.getMinutes()).padStart(2, '0');
  const seconds = String(koreanDate.getSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * 상대적 시간 표시 (예: "3분 전", "1시간 전")
 * @param {string} dateString - ISO 형식의 날짜 문자열
 * @returns {string} - 상대적 시간 문자열
 */
export const formatToRelativeTime = (dateString) => {
  if (!dateString) return '-';
  
  const utcDate = new Date(dateString);
  const now = new Date();
  const diffMs = now - utcDate; // UTC 기준으로 차이 계산
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return '방금 전';
  } else if (diffMin < 60) {
    return `${diffMin}분 전`;
  } else if (diffHour < 24) {
    return `${diffHour}시간 전`;
  } else if (diffDay < 7) {
    return `${diffDay}일 전`;
  } else {
    return formatToKoreanDate(dateString);
  }
}; 