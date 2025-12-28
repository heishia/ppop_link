# Git Release 생성 가이드

이 문서는 PPOPLINK 프로젝트에서 Git Release를 생성하는 방법을 설명합니다.

## Release 생성 방법

### 방법 1: GitHub 웹 UI 사용 (권장)

1. **GitHub 저장소로 이동**
   - https://github.com/your-org/ppoplink 접속

2. **Releases 페이지로 이동**
   - 저장소 메인 페이지에서 오른쪽 사이드바의 "Releases" 클릭
   - 또는 직접 URL: `https://github.com/your-org/ppoplink/releases`

3. **새 Release 생성**
   - "Draft a new release" 또는 "Create a new release" 버튼 클릭

4. **Release 정보 입력**
   - **Tag version**: 버전 태그 입력 (예: `v1.2.0`)
     - 새 태그 생성: "Create new tag: v1.2.0" 선택
     - 기존 태그 사용: 드롭다운에서 선택
   - **Target**: 브랜치 선택 (보통 `main` 또는 `master`)
   - **Release title**: Release 제목 (예: "Release v1.2.0 - 헤더 네비게이션 및 SEO 최적화")
   - **Description**: Release 노트 작성
     ```markdown
     ## 주요 변경사항
     - 메인 페이지에 헤더 네비게이션 추가
     - 카테고리 메뉴 추가 (도움말, 소개, 업데이트 소식, 컨텐츠)
     - 네이버 검색 최적화 적용
     - SEO 메타 태그 및 구조화된 데이터 추가
     - 사이트맵 및 robots.txt 생성

     ## 기술적 변경사항
     - MainHeader 컴포넌트 추가
     - 각 카테고리 페이지 생성
     - 네이버 웹마스터 도구 인증 메타 태그 추가
     ```

5. **Release 옵션 설정**
   - **Set as the latest release**: 최신 Release로 설정 (체크 권장)
   - **Set as a pre-release**: 베타/알파 버전인 경우 체크

6. **Release 생성**
   - "Publish release" 버튼 클릭

7. **자동 배포 확인**
   - Release가 생성되면 `.github/workflows/release-deploy.yml` 워크플로우가 자동 실행됩니다
   - Actions 탭에서 배포 진행 상황 확인 가능

### 방법 2: GitHub CLI 사용

1. **GitHub CLI 설치** (아직 설치하지 않은 경우)
   ```bash
   # Windows (Chocolatey)
   choco install gh

   # macOS (Homebrew)
   brew install gh

   # Linux
   # https://github.com/cli/cli/blob/trunk/docs/install_linux.md
   ```

2. **GitHub CLI 로그인**
   ```bash
   gh auth login
   ```

3. **Release 생성**
   ```bash
   # 기본 Release 생성
   gh release create v1.2.0 --title "Release v1.2.0" --notes "Release notes here"

   # 파일 첨부와 함께 생성
   gh release create v1.2.0 --title "Release v1.2.0" --notes-file CHANGELOG.md --latest

   # Pre-release로 생성
   gh release create v1.2.0 --title "Release v1.2.0" --notes "Beta release" --prerelease

   # 특정 브랜치에서 생성
   gh release create v1.2.0 --target main --title "Release v1.2.0" --notes "Release notes"
   ```

4. **Release 노트 파일 사용**
   ```bash
   # CHANGELOG.md 파일을 Release 노트로 사용
   gh release create v1.2.0 --notes-file CHANGELOG.md
   ```

### 방법 3: Git 태그 + 수동 Release 생성

1. **로컬에서 태그 생성**
   ```bash
   # 태그 생성
   git tag -a v1.2.0 -m "Release v1.2.0 - 헤더 네비게이션 및 SEO 최적화"

   # 태그 푸시
   git push origin v1.2.0

   # 모든 태그 푸시
   git push origin --tags
   ```

2. **GitHub에서 Release 생성**
   - 방법 1의 2-6단계를 따라 GitHub 웹 UI에서 Release 생성
   - 이번에는 "Choose a tag" 드롭다운에서 방금 생성한 태그 선택

## 버전 번호 규칙

프로젝트는 [Semantic Versioning](https://semver.org/)을 따릅니다:

- **MAJOR.MINOR.PATCH** 형식 (예: `v1.2.0`)
- **MAJOR**: 호환되지 않는 API 변경
- **MINOR**: 하위 호환되는 기능 추가
- **PATCH**: 하위 호환되는 버그 수정

### 예시
- `v1.0.0`: 첫 정식 출시
- `v1.1.0`: 새로운 기능 추가 (분석 기능 개선)
- `v1.2.0`: 새로운 기능 추가 (헤더 네비게이션)
- `v1.2.1`: 버그 수정
- `v2.0.0`: 주요 변경사항 (호환되지 않는 변경)

## Release 노트 작성 가이드

Release 노트는 사용자와 개발자 모두에게 중요한 정보를 제공합니다.

### 좋은 Release 노트 예시

```markdown
## Release v1.2.0 - 헤더 네비게이션 및 SEO 최적화

### 새로운 기능
- ✨ 메인 페이지에 헤더 네비게이션 추가
- ✨ 카테고리 메뉴 추가 (도움말, 소개, 업데이트 소식, 컨텐츠)
- ✨ 도움말 페이지 추가
- ✨ 회사소개 페이지 추가
- ✨ 업데이트 소식 페이지 추가
- ✨ 컨텐츠 페이지 추가 (목록 및 상세)

### 개선사항
- 🔍 네이버 검색 최적화 적용
- 🔍 SEO 메타 태그 및 구조화된 데이터 추가
- 🔍 사이트맵 및 robots.txt 자동 생성
- 🎨 헤더 디자인 개선 (구분선 제거, 폰트 변경)

### 기술적 변경사항
- MainHeader 컴포넌트 추가
- 각 카테고리 페이지에 SEO 메타 태그 적용
- 네이버 웹마스터 도구 인증 메타 태그 추가
- 구조화된 데이터(JSON-LD) 추가

### 문서
- Release 가이드 문서 추가
```

### 이모지 사용 (선택사항)
- ✨ 새로운 기능
- 🐛 버그 수정
- 🔍 개선사항
- 🎨 디자인 변경
- 📝 문서
- 🔧 설정 변경
- ⚡ 성능 개선
- 🔒 보안

## 자동 배포 프로세스

Release가 생성되면 다음 프로세스가 자동으로 실행됩니다:

1. **변경사항 감지**
   - 이전 Release와 비교하여 변경된 파일 확인
   - `web/` 폴더 변경 → Web 배포 트리거
   - `backend/` 폴더 변경 → Backend 배포 트리거

2. **배포 실행**
   - **Backend**: Railway 프로덕션 환경에 배포
   - **Web**: Vercel 프로덕션 환경에 배포

3. **Health Check**
   - 배포 후 서비스 상태 확인

4. **Sentry Release 생성**
   - 에러 추적을 위한 Sentry Release 생성

5. **알림**
   - Slack으로 배포 완료 알림 전송

## Release 확인 및 모니터링

### GitHub Actions 확인
```bash
# Actions 실행 상태 확인
gh run list --workflow=release-deploy.yml

# 특정 실행 상세 정보
gh run view <run-id>
```

### 배포 상태 확인
- **Backend**: https://api.ppoplink.site/health
- **Web**: https://ppoplink.site
- **Sentry**: https://sentry.io (Release 페이지)

## 문제 해결

### Release 생성 후 배포가 시작되지 않는 경우

1. **워크플로우 파일 확인**
   ```bash
   cat .github/workflows/release-deploy.yml
   ```

2. **Actions 탭에서 에러 확인**
   - GitHub 저장소 → Actions 탭
   - 실패한 워크플로우 클릭하여 에러 로그 확인

3. **수동 트리거**
   - Actions 탭 → "Release Production Deployment" 워크플로우 선택
   - "Run workflow" 클릭
   - Release 태그 입력 후 실행

### 태그가 이미 존재하는 경우

```bash
# 로컬 태그 삭제
git tag -d v1.2.0

# 원격 태그 삭제
git push origin --delete v1.2.0

# 다시 생성
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

## 참고 자료

- [GitHub Releases 문서](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [GitHub CLI 문서](https://cli.github.com/manual/)
- [Semantic Versioning](https://semver.org/)
- [프로젝트 CI/CD 아키텍처](./CI_CD_ARCHITECTURE.md)

