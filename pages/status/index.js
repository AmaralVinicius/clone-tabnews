import useSWR from "swr";

async function fetchApi(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchApi, {
    refreshInterval: 2000,
  });

  const updatedAtText = isLoading
    ? "Carregando..."
    : new Date(data.updated_at).toLocaleString("pt-BR");

  return <div>Última atualização: {updatedAtText}</div>;
}

function DatabaseStatus() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchApi, {
    refreshInterval: 2000,
  });

  const databaseStatusInformation = isLoading ? (
    "Carregando..."
  ) : (
    <>
      <div>Versão: {data.dependencies.database.version}</div>
      <div>
        Conexões Abertas: {data.dependencies.database.opened_connections}
      </div>
      <div>Conexões Máximas: {data.dependencies.database.max_connections}</div>
    </>
  );

  return (
    <>
      <h2>Database</h2>
      <div>{databaseStatusInformation}</div>
    </>
  );
}

function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DatabaseStatus />
    </>
  );
}

export default StatusPage;
