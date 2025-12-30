# 개발자 IP 구분 가이드 🔍

## 📍 내 IP 확인 방법

### 방법 1: 웹사이트에서 확인 (가장 쉬움)
브라우저에서 열기:
- https://www.whatismyip.com/
- https://ipinfo.io/
- https://api.ipify.org (IP만 간단히 표시)

### 방법 2: PowerShell 명령어
PowerShell을 **직접** 열어서 실행:
```powershell
(Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
```

### 방법 3: 백엔드 로그에서 확인
Railway 로그를 보면 요청한 IP가 나와요. 로그인할 때 IP가 기록됩니다.

---

## 🎯 로그에서 내 IP 구분하기

### 설정 방법

1. **Railway 환경변수에 내 IP 추가**
   ```
   DEVELOPER_IPS=당신의IP주소
   ```
   
   여러 개면 쉼표로 구분:
   ```
   DEVELOPER_IPS=1.2.3.4,5.6.7.8
   ```

2. **배포 후 로그 확인**
   
   **일반 사용자 요청:**
   ```
   Malicious pattern blocked: /api/test from 123.45.67.89
   ```
   
   **개발자(본인) 요청:**
   ```
   Malicious pattern blocked: /api/test from [DEV] 1.2.3.4
   ```

### Railway에서 환경변수 설정하기

1. Railway 프로젝트 대시보드 접속
2. 백엔드 서비스 선택
3. **Variables** 탭 클릭
4. **New Variable** 클릭
5. 추가:
   - Variable Name: `DEVELOPER_IPS`
   - Value: `당신의IP주소` (예: `123.45.67.89`)
6. **Deploy** 클릭

---

## 📊 로그 예시

### Before (설정 전)
```
2025-12-30T10:15:21 [WARNING] Malicious pattern blocked: /.env from 123.45.67.89
2025-12-30T10:15:22 [WARNING] Malicious pattern blocked: /.git/ from 123.45.67.89
2025-12-30T10:15:23 [WARNING] Rate limit exceeded from 98.76.54.32
```

### After (설정 후)
```
2025-12-30T10:15:21 [WARNING] Malicious pattern blocked: /.env from [DEV] 123.45.67.89  ← 내 요청!
2025-12-30T10:15:22 [WARNING] Malicious pattern blocked: /.git/ from [DEV] 123.45.67.89  ← 내 요청!
2025-12-30T10:15:23 [WARNING] Rate limit exceeded from 98.76.54.32  ← 다른 사람
```

---

## 💡 활용 팁

### 1. 로그 필터링
Railway 로그에서 검색:
- `[DEV]` 검색 → 내 요청만 보기
- `-[DEV]` 검색 → 다른 사람 요청만 보기 (일부 로그 뷰어에서 지원)

### 2. 여러 장소에서 개발할 때
집, 회사, 카페 등 여러 곳에서 개발한다면:
```
DEVELOPER_IPS=집IP,회사IP,카페IP
```

### 3. IP가 자주 바뀐다면?
- 고정 IP 사용 (ISP에 문의)
- VPN 사용 (고정 IP VPN)
- 또는 매번 Railway 환경변수 업데이트

### 4. 팀원 추가
팀원 IP도 추가 가능:
```
DEVELOPER_IPS=내IP,팀원1IP,팀원2IP
```

---

## 🔒 보안 참고사항

### 주의사항
- **개발자 IP라고 해서 보안 검사를 우회하지 않습니다**
- 단지 **로그에서 구분**만 됩니다
- 악의적인 패턴은 개발자 IP도 차단됩니다

### 왜 이렇게 했나?
- 보안을 유지하면서
- 로그 분석을 쉽게 하기 위함
- 실제 공격과 개발/테스트를 구분

---

## 🚀 적용 완료!

이제 다음과 같이 작동합니다:

1. ✅ 내 IP로 요청 → 로그에 `[DEV]` 태그 표시
2. ✅ 다른 IP로 요청 → 일반 로그
3. ✅ 보안 검사는 모든 IP에 동일하게 적용
4. ✅ 로그 분석이 훨씬 쉬워짐

---

## 📝 체크리스트

- [ ] 내 IP 확인 (https://api.ipify.org)
- [ ] Railway 환경변수에 `DEVELOPER_IPS` 추가
- [ ] 백엔드 재배포
- [ ] 로그에서 `[DEV]` 태그 확인
- [ ] 필요시 팀원 IP도 추가

완료! 🎉

