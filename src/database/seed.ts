import { db } from "./client.ts";
import { users, belts, categories, classes, checkins } from "./schema.ts";
import { faker } from "@faker-js/faker";
import * as bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Iniciando seed do banco de dados...");

  try {
    // PASSO 1: Limpar dados existentes (ordem inversa das dependências)
    console.log("🧹 Limpando dados existentes...");
    await db.delete(checkins);
    await db.delete(classes);
    await db.delete(users);
    await db.delete(categories);
    await db.delete(belts);

    // PASSO 2: Criar as faixas (belts)
    // Estas são fixas no jiu-jitsu, então vamos criar dados específicos
    console.log("🥋 Criando faixas...");
    const beltsData = [
      { belt: "white" as const, requiredClasses: 0 },
      { belt: "blue" as const, requiredClasses: 80 },
      { belt: "purple" as const, requiredClasses: 120 },
      { belt: "brown" as const, requiredClasses: 150 },
      { belt: "black" as const, requiredClasses: 200 },
    ];

    const createdBelts = await db.insert(belts).values(beltsData).returning();
    console.log(`✅ ${createdBelts.length} faixas criadas`);

    // PASSO 3: Criar categorias
    console.log("📋 Criando categorias...");
    const categoriesData = [
      {
        type: "Misto" as const,
        description: "Aulas abertas para todos os níveis e idades",
      },
      {
        type: "Kids I" as const,
        description: "Aulas para crianças de 4 a 7 anos",
      },
      {
        type: "Kids II" as const,
        description: "Aulas para crianças de 8 a 12 anos",
      },
      {
        type: "Iniciante" as const,
        description: "Aulas focadas em fundamentos para iniciantes",
      },
      {
        type: "Competição" as const,
        description: "Treino intensivo para atletas competidores",
      },
      {
        type: "Intermediário" as const,
        description: "Aulas para praticantes com experiência moderada",
      },
      {
        type: "Avançado" as const,
        description: "Aulas avançadas com técnicas complexas",
      },
    ];

    const createdCategories = await db
      .insert(categories)
      .values(categoriesData)
      .returning();
    console.log(`✅ ${createdCategories.length} categorias criadas`);

    // PASSO 4: Criar usuários
    // Vamos criar um admin, alguns instrutores e vários alunos
    console.log("👥 Criando usuários...");

    const password = await bcrypt.hash("senha123", 10);

    // Criar 1 admin
    const adminUser = await db
      .insert(users)
      .values({
        name: "Admin Sistema",
        email: "admin@academia.com",
        password,
        role: "admin",
        birthDate: "1985-05-15",
        gender: "male",
        phone: faker.string.numeric({ length: 11 }),
        isActive: true,
        beltId: createdBelts[4].id, // faixa preta
      })
      .returning();

    // Criar 3 instrutores
    const instructors = [];
    for (let i = 0; i < 3; i++) {
      const instructor = await db
        .insert(users)
        .values({
          name: faker.person.fullName(),
          email: `instrutor${i + 1}@academia.com`,
          password,
          role: "instructor",
          birthDate: faker.date
            .birthdate({ min: 25, max: 45, mode: "age" })
            .toISOString()
            .split("T")[0],
          gender: faker.helpers.arrayElement(["male", "female"]),
          phone: faker.string.numeric({ length: 11 }),
          isActive: true,
          // Instrutores geralmente são faixa roxa, marrom ou preta
          beltId: faker.helpers.arrayElement([
            createdBelts[2].id,
            createdBelts[3].id,
            createdBelts[4].id,
          ]),
        })
        .returning();
      instructors.push(instructor[0]);
    }

    // Criar 30 alunos
    const students = [];
    for (let i = 0; i < 30; i++) {
      const student = await db
        .insert(users)
        .values({
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          password,
          role: "student",
          birthDate: faker.date
            .birthdate({ min: 8, max: 50, mode: "age" })
            .toISOString()
            .split("T")[0],
          gender: faker.helpers.arrayElement(["male", "female"]),
          phone: faker.string.numeric({ length: 11 }),
          isActive: faker.datatype.boolean({ probability: 0.85 }), // 85% ativos
          // Distribuição realista de faixas (mais faixas brancas e azuis)
          beltId: faker.helpers.weightedArrayElement([
            { weight: 40, value: createdBelts[0].id }, // white
            { weight: 30, value: createdBelts[1].id }, // blue
            { weight: 15, value: createdBelts[2].id }, // purple
            { weight: 10, value: createdBelts[3].id }, // brown
            { weight: 5, value: createdBelts[4].id }, // black
          ]),
        })
        .returning();
      students.push(student[0]);
    }

    console.log(
      `✅ ${1 + instructors.length + students.length} usuários criados`
    );

    // PASSO 5: Criar aulas
    // Vamos criar aulas para os próximos 30 dias
    console.log("📅 Criando aulas...");

    const classesArray = [];
    const today = new Date();

    // Horários típicos de aulas (formato: hora e duração em minutos)
    const classSchedules = [
      { hour: 6, duration: 90 }, // manhã cedo
      { hour: 9, duration: 60 }, // meio da manhã
      { hour: 12, duration: 60 }, // almoço
      { hour: 18, duration: 90 }, // tarde/noite
      { hour: 20, duration: 60 }, // noite
    ];

    for (let day = 0; day < 30; day++) {
      const classDate = new Date(today);
      classDate.setDate(today.getDate() + day);

      // Criar 2-4 aulas por dia
      const classesPerDay = faker.number.int({ min: 2, max: 4 });

      for (let c = 0; c < classesPerDay; c++) {
        const schedule = faker.helpers.arrayElement(classSchedules);
        const startTime = new Date(classDate);
        startTime.setHours(schedule.hour, 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + schedule.duration);

        const category = faker.helpers.arrayElement(createdCategories);
        const instructor = faker.helpers.arrayElement(instructors);

        const classData = await db
          .insert(classes)
          .values({
            title: `Treino ${category.type}`,
            description: `Aula de ${category.type.toLowerCase()} com foco em técnicas e sparring`,
            date: classDate.toISOString().split("T")[0], // ✅ Date está como string, isso está correto
            startTime: startTime, // ✅ Passe o objeto Date diretamente
            endTime: endTime, // ✅ Passe o objeto Date diretamente
            capacity: faker.number.int({ min: 15, max: 30 }),
            instructorId: instructor.id,
            categoryId: category.id,
          })
          .returning();

        classesArray.push(classData[0]);
      }
    }

    console.log(`✅ ${classesArray.length} aulas criadas`);

    // PASSO 6: Criar check-ins
    // Vamos simular que alunos ativos fazem check-in em algumas aulas
    console.log("✔️ Criando check-ins...");

    let checkinsCount = 0;
    const activeStudents = students.filter((s) => s.isActive);

    // Para cada aula, vamos fazer check-in de alguns alunos
    for (const classItem of classesArray) {
      // Número aleatório de check-ins (entre 40% e 90% da capacidade)
      const checkinsForClass = faker.number.int({
        min: Math.floor(classItem.capacity * 0.4),
        max: Math.floor(classItem.capacity * 0.9),
      });

      // Selecionar alunos aleatórios
      const selectedStudents = faker.helpers.arrayElements(
        activeStudents,
        checkinsForClass
      );

      for (const student of selectedStudents) {
        await db.insert(checkins).values({
          userId: student.id,
          classId: classItem.id,
          status: faker.helpers.weightedArrayElement([
            { weight: 95, value: "done" as const },
            { weight: 5, value: "cancelled" as const },
          ]),
          completedAt: new Date(classItem.startTime), // ✅ Isso já está correto
        });
        checkinsCount++;
      }
    }

    console.log(`✅ ${checkinsCount} check-ins criados`);

    console.log("✨ Seed concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    throw error;
  }
}

// Executar o seed
seed()
  .then(() => {
    console.log("👋 Encerrando processo...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Falha no seed:", error);
    process.exit(1);
  });