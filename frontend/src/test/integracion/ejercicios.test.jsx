import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { admin, ejercicios, grupos } from "../handlers";
import { capturarBody, renderizarApp } from "../renderizarApp";
import { server } from "../server";

function listaEjercicios() {
  return screen.getByRole("list", { name: "Ejercicios" });
}

describe("catálogo de ejercicios", () => {
  it("lista los ejercicios y filtra por búsqueda", async () => {
    const { user } = renderizarApp("/ejercicios");

    expect(await screen.findByText("3 de 3 ejercicios")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Buscar ejercicio"), "sentad");

    expect(within(listaEjercicios()).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("1 de 3 ejercicios")).toBeInTheDocument();
  });

  it("un usuario solo puede editar sus ejercicios, no los globales", async () => {
    const { user } = renderizarApp("/ejercicios");

    await user.click(await screen.findByRole("button", { name: /Press de banca/ }));
    expect(screen.queryByRole("button", { name: /Editar/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Curl martillo de Ana/ }));
    expect(screen.getByRole("button", { name: /Editar/ })).toBeInTheDocument();
  });

  it("crea un ejercicio personal con grupos musculares", async () => {
    const body = capturarBody();
    server.use(
      http.post("*/api/exercises", async ({ request }) => {
        await body.guardar(request);
        return HttpResponse.json(
          {
            exercise: {
              id: 99,
              nombre: "Remo con banda",
              dificultad: "principiante",
              userId: 2,
              muscleGroups: [],
            },
          },
          { status: 201 },
        );
      }),
    );
    const { user } = renderizarApp("/ejercicios");

    await user.click(await screen.findByRole("button", { name: /Nuevo ejercicio/ }));
    const form = screen.getByRole("form", { name: "Formulario de ejercicio" });
    expect(within(form).queryByText(/catálogo global/)).not.toBeInTheDocument();
    await user.type(within(form).getByLabelText("Nombre"), "Remo con banda");
    await user.click(within(form).getByLabelText("Antebrazos"));
    await user.click(within(form).getByRole("button", { name: "Crear ejercicio" }));

    expect(await screen.findByText("Se creó Remo con banda.")).toBeInTheDocument();
    expect(body.ultima).toEqual({
      nombre: "Remo con banda",
      descripcion: "",
      dificultad: "principiante",
      imagen: "",
      muscleGroupIds: [3],
    });
  });

  it("el admin puede publicar en el catálogo global con grupos globales", async () => {
    const body = capturarBody();
    server.use(
      http.get("*/api/auth/perfil", () => HttpResponse.json({ user: admin })),
      http.post("*/api/exercises", async ({ request }) => {
        await body.guardar(request);
        return HttpResponse.json(
          { exercise: { id: 98, nombre: "Hip thrust", userId: null, muscleGroups: [] } },
          { status: 201 },
        );
      }),
    );
    const { user } = renderizarApp("/ejercicios", { user: admin });

    await user.click(await screen.findByRole("button", { name: /Nuevo ejercicio/ }));
    const form = screen.getByRole("form", { name: "Formulario de ejercicio" });
    await user.type(within(form).getByLabelText("Nombre"), "Hip thrust");
    await user.click(within(form).getByLabelText(/Publicar en el catálogo global/));
    // Con global, los grupos personales dejan de ofrecerse.
    expect(within(form).queryByLabelText("Antebrazos")).not.toBeInTheDocument();
    await user.click(within(form).getByLabelText("Piernas"));
    await user.click(within(form).getByRole("button", { name: "Crear ejercicio" }));

    await screen.findByText("Se creó Hip thrust.");
    expect(body.ultima).toMatchObject({ nombre: "Hip thrust", global: true, muscleGroupIds: [2] });
  });

  it("muestra el motivo cuando no se puede borrar un ejercicio con historial", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    server.use(
      http.delete("*/api/exercises/:id", () =>
        HttpResponse.json(
          {
            error:
              "No se puede eliminar: el ejercicio tiene 6 series registradas en entrenamientos",
          },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderizarApp("/ejercicios");

    await user.click(await screen.findByRole("button", { name: /Curl martillo de Ana/ }));
    await user.click(screen.getByRole("button", { name: "Eliminar Curl martillo de Ana" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("6 series registradas");
    expect(screen.getByRole("button", { name: /^Curl martillo de Ana/ })).toBeInTheDocument();
  });
});

describe("grupos musculares", () => {
  it("crea, renombra y elimina un grupo personal", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    server.use(
      http.post("*/api/muscle-groups", async ({ request }) => {
        const { nombre } = await request.json();
        return HttpResponse.json({ muscleGroup: { id: 7, nombre, userId: 2 } }, { status: 201 });
      }),
      http.put("*/api/muscle-groups/:id", async ({ request, params }) => {
        const { nombre } = await request.json();
        return HttpResponse.json({ muscleGroup: { id: Number(params.id), nombre, userId: 2 } });
      }),
      http.delete("*/api/muscle-groups/:id", () => HttpResponse.json({ message: "ok" })),
    );
    const { user } = renderizarApp("/ejercicios");

    await user.type(await screen.findByLabelText("Nombre del nuevo grupo muscular"), "Cuello");
    await user.click(screen.getByRole("button", { name: /Agregar/ }));
    expect(await screen.findByText("Se creó el grupo Cuello.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Renombrar Antebrazos" }));
    const input = screen.getByLabelText("Nuevo nombre para Antebrazos");
    await user.clear(input);
    await user.type(input, "Antebrazo");
    await user.click(screen.getByRole("button", { name: "Guardar nombre" }));
    expect(await screen.findByText("Se renombró el grupo a Antebrazo.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Eliminar grupo Cuello" }));
    expect(await screen.findByText("Se eliminó el grupo Cuello.")).toBeInTheDocument();
  });

  it("los grupos globales no se pueden editar siendo usuario", async () => {
    renderizarApp("/ejercicios");

    await screen.findByText(`${grupos.length} grupos`);
    expect(screen.queryByRole("button", { name: "Renombrar Pecho" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Renombrar Antebrazos" })).toBeInTheDocument();
  });

  it("informa un nombre duplicado", async () => {
    server.use(
      http.post("*/api/muscle-groups", () =>
        HttpResponse.json(
          { error: 'Ya existe un grupo muscular llamado "Pecho"' },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderizarApp("/ejercicios");

    await user.type(await screen.findByLabelText("Nombre del nuevo grupo muscular"), "pecho");
    await user.click(screen.getByRole("button", { name: /Agregar/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe un grupo muscular");
    expect(ejercicios).toHaveLength(3);
  });
});
