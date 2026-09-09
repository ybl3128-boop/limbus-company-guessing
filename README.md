# 림버스컴퍼니맞추기

림버스 컴퍼니의 인격을 추리하는 일일 게임의 정적 MVP입니다.

## 실행

브라우저에서 `index.html`을 직접 열기보다 로컬 서버를 사용해야 합니다.

```powershell
python -m http.server 8080
```

그 다음 브라우저에서 `http://localhost:8080`을 엽니다.

## 현재 구현된 규칙

- 하루 하나의 오늘의 인격
- 최대 6회 추측
- 수감자 이름, 시즌, 특성 키워드 전체, 주요 키워드, 스킬 3 죄악 속성, 스킬 3 공격 유형 비교
- 목록형 항목은 완전 일치 초록색, 일부 일치 노란색, 불일치 빨간색
- 결과 화면에서만 정답 이미지 표시
- 브라우저 로컬 저장소에 추측 기록과 연속 정답 저장

## 데이터 업데이트 구조

`scripts/sync-wiki.mjs`가 `limbuscompany.wiki.gg`의 MediaWiki API에서 실제 장착 가능한 인격 페이지와 스킬 정보를 가져와 `data/identities.json`을 생성합니다. E.G.O 스킬 페이지는 제외하지만, E.G.O 인격(예: 로보토미 E.G.O 인격)은 포함합니다. 이벤트 전투 전용 변형인 Cheery Chickies, Early Elephants, Perky Penguins 계열은 제외합니다.

게임 데이터는 영어 원문을 기준으로 수집하지만, 검색과 화면에는 한국어 표시명을 사용합니다. 한국어 표시명은 나무위키의 [Limbus Company/인격 & E.G.O](https://namu.wiki/w/Limbus%20Company/%EC%9D%B8%EA%B2%A9%20%26%20E.G.O) 및 수감자별 인게임 정보 표기를 대조해 정규화하며, 개별 수정은 `data/name-map.ko.json`에서 덮어쓸 수 있습니다.

죄악 속성과 공격 유형은 `Skill 3` 블록만 읽습니다. 사용 키워드는 기본 스킬 1·2·3의 설명에서 주요 키워드 7개만 추출합니다.

```powershell
npm run sync
npm run generate:puzzles
npm run check:game-data
npm run check:duplicates
npm run serve
```

`generate:puzzles`는 UTC 날짜 기준으로 날짜별 정답을 생성합니다. 이미 배정된 날짜의 정답은 보존하고, 최근 30일 안에 나온 인격은 가능한 한 다시 배정하지 않습니다.

## 자동 업데이트

전체 데이터 갱신은 아래 명령 하나로 실행합니다.

```powershell
npm run update:data
```

이 명령은 위키 동기화, 일일 정답표 보충, 데이터 검사, 중복 검사를 순서대로 실행합니다.

GitHub Actions가 매주 금요일 자동으로 데이터를 갱신하도록 설정되어 있습니다.

```text
.github/workflows/update-data.yml
```

자동 업데이트 설정:

- 주기: 매주 금요일 오전 4시(KST)
- 실행 환경: GitHub Actions
- 동작: 위키 동기화 → 정답표 보충 → 데이터 검사 → 중복 검사 → 변경 시 자동 커밋
- 데이터가 변경되면 GitHub Pages 배포 workflow가 자동으로 다시 실행됩니다.

수동으로 즉시 실행하려면 저장소의 Actions → `Update identity data` → `Run workflow`를 선택합니다.

## 정적 배포

이 프로젝트는 별도 빌드 과정이 없는 정적 사이트라 GitHub Pages, Netlify, Cloudflare Pages 등에 그대로 배포할 수 있습니다.

GitHub Pages 기준:

1. 이 폴더를 GitHub 저장소에 업로드합니다.
2. 저장소의 Settings → Pages로 이동합니다.
3. 배포 소스를 `Deploy from a branch`로 선택합니다.
4. 브랜치는 `main`, 폴더는 `/ (root)`로 설정합니다.
5. 저장 후 생성된 Pages 주소로 접속합니다.

배포 전 확인:

- `index.html`을 저장소 루트에 둡니다.
- `data/` 폴더를 함께 업로드합니다.
- `.nojekyll` 파일을 삭제하지 않습니다.
- 공개 사이트에서 이미지 사용 권한을 최종 확인합니다.
- 데이터 업데이트는 로컬 또는 별도 자동화 환경에서 `npm run update:data`로 실행합니다.
