export default function SearchResultPanel({ results, activeSearchUser, onSelectSearchUser }) {
  if (results.length === 0) {
    return null;
  }

  return (
    <>
      <div className="search-result-panel search-result-panel-full">
        <div className="search-result-heading">Kết quả tìm user</div>
        <div className="search-result-grid">
          {results.map((resultUser) => (
            <button
              key={resultUser.id}
              type="button"
              className={`search-user-card ${activeSearchUser?.id === resultUser.id ? "active" : ""}`}
              onClick={() => onSelectSearchUser(resultUser)}
            >
              <div className="search-user-name">{resultUser.name}</div>
              {resultUser.email && <div className="search-user-email">{resultUser.email}</div>}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-empty search-result-empty-note">Chọn một user để bắt đầu trò chuyện</div>
    </>
  );
}
