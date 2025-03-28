import { useState } from "react";
import "./styles.css"
import Swal from "sweetalert2";
import { getMonthDayCount, maskDate } from "../../helpers/date-helper";
import Api from "../../Api";
import { DailyValue, Goal } from "../../types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth-context";
import { getNotificationPermissionStatus, requestNotificationPermission } from "../../helpers/notification-helper";
import { useTheme } from "../../contexts/theme-context";

interface Props {
    callback(): void;
}

export default function Header(props: Props) {
    const { getTheme, setTheme } = useTheme();
    const navigate = useNavigate();
    const { user, setAuth } = useAuth();
    const [menuActive, setMenuActive] = useState(false);

    function handleSetMenuStatus(value: boolean) {
        document.querySelector("body").style.overflow = value ? "hidden" : "";
        setMenuActive(value);
    }

    async function handleSetGoals() {
        handleSetMenuStatus(false);

        await Swal.fire({
            title: "Ajuste de metas do mês",
            html: `
              <input id="swal-input1" class="swal2-input" type="number" placeholder="Meta prata">
              <input id="swal-input2" class="swal2-input" type="number" placeholder="Meta ouro">
              <input id="swal-input3" class="swal2-input" type="number" placeholder="Meta diamante">
            `,
            showCancelButton: true,
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#7adae3",
            confirmButtonText: "Salvar",
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                var data = {
                    silver: (document.getElementById("swal-input1") as HTMLInputElement).value,
                    gold: (document.getElementById("swal-input2") as HTMLInputElement).value,
                    diamond: (document.getElementById("swal-input3") as HTMLInputElement).value,
                }

                if (!data?.silver || !data?.gold || !data?.diamond) {
                    Swal.showValidationMessage("Necessário informar as 3 metas!");
                    return null;
                }

                const result = await Api.SetGoal({
                    user_id: user.id,
                    silver: Number(data.silver),
                    gold: Number(data.gold),
                    diamond: Number(data.diamond),
                    date: new Date().toJSON().substring(0, 7)
                } as Goal);
                if (!result) {
                    Swal.showValidationMessage("Não foi possível setar sua meta no momento, realize um novo login e tente novamente!");
                    return null;
                }

                await Swal.fire({
                    title: "Metas do mês ajustadas com sucesso!",
                    icon: "success",
                    draggable: true
                });

                props.callback();
            }
        });
    }

    async function handleSetDailyValue() {
        handleSetMenuStatus(false);

        var currentDay = new Date().getDate();

        await Swal.fire({
            title: "Lançamento de valores diários",
            html: `
              <select id="swal-select" class="swal2-select">
                ${getSelectOptions().map((x) =>
                `<option value="${x.toJSON()}" ${x.getDate() === currentDay ? "selected" : ""}>${maskDate(x)}</option>`
            )}
              </select>
              <input id="swal-input" class="swal2-input" type="number" placeholder="Valor vendido">
            `,
            showCancelButton: true,
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#7adae3",
            confirmButtonText: "Salvar",
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                var data = {
                    date: (document.getElementById("swal-select") as HTMLInputElement).value,
                    value: (document.getElementById("swal-input") as HTMLInputElement).value
                }

                if (!data?.date || !data?.value) {
                    Swal.showValidationMessage("Necessário informar a data e o valor!");
                    return null;
                }

                const result = await Api.SetDailyValue({
                    user_id: user.id,
                    value: Number(data.value),
                    date: new Date(data.date)
                } as DailyValue);
                if (!result) {
                    Swal.showValidationMessage("Não foi possível realizar o lançamento no momento, realize um novo login e tente novamente!");
                    return null;
                }

                await Swal.fire({
                    title: "Lançamento realizado com sucesso!",
                    icon: "success",
                    draggable: true
                });

                props.callback();
            }
        });
    }

    function getSelectOptions() {
        var date = new Date();
        return Array.from(
            { length: getMonthDayCount() },
            (_, index) => new Date(date.getFullYear(), date.getMonth(), index + 1)
        );
    }

    async function handleNotificationPermission() {
        handleSetMenuStatus(false);

        const permissionStatus = getNotificationPermissionStatus();
        if (!permissionStatus) {
            await Swal.fire({
                title: "Não é possível enviar notificações para este dispositivo!",
                icon: "info",
                draggable: true
            });

            return;
        }

        if (permissionStatus === "denied") {
            await Swal.fire({
                title: "As notificações foram desativadas pelo usuário!",
                icon: "info",
                draggable: true
            });

            return;
        }

        if (permissionStatus === "granted") {
            await Swal.fire({
                title: "As notificações estão ativas!",
                icon: "success",
                draggable: true
            });

            return;
        }

        await Swal.fire({
            title: "Ativação de notificação",
            text: "Deseja ativar as notificações do app?",
            icon: "question",
            showCancelButton: true,
            cancelButtonText: "Não",
            confirmButtonColor: "#7adae3",
            confirmButtonText: "Sim",
            preConfirm: async () => {
                const permission = await requestNotificationPermission()
                if (!permission) {
                    await Swal.fire({
                        title: "Notificações desativadas pelo usuário!",
                        icon: "info",
                        draggable: true
                    });

                    return;
                }

                new window.Notification(
                    "NuveLu | Análise de Meta",
                    {
                        body: "Oba! Agora a ovelhinha pode te avisar sobre suas metas por aqui!",
                        icon: "https://nuvelu.taniorocha.com.br/favicon.png"
                    }
                );

                await Swal.fire({
                    title: "Notificações ativadas com sucesso!",
                    icon: "success",
                    draggable: true
                });
            }
        });
    }

    async function handleThemeColor() {
        handleSetMenuStatus(false);

        const currentTheme = getTheme();
        await Swal.fire({
            title: "Selecione o tema desejado",
            html: `
                <div class="swal2-radio" style="display: flex; margin: 0; font-size: 15px;">
                    <label style="display: flex; align-items: center;">
                        <input type="radio" name="swal2-radio" value="light" ${currentTheme === "light" ? "checked=true" : ""}>
                        <span class="swal2-label" style="color: #575757;">Claro</span>
                    </label>
                    <label style="display: flex; align-items: center;">
                        <input type="radio" name="swal2-radio" value="dark" ${currentTheme === "dark" ? "checked=true" : ""}>
                        <span class="swal2-label" style="color: #575757;">Escuro</span>
                    </label>
                </div>
            `,
            showCancelButton: true,
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#7adae3",
            confirmButtonText: "Salvar",
            preConfirm: async () => {
                const value = (document.querySelector('input[name=swal2-radio]:checked') as HTMLInputElement)?.value;
                if (!value) {
                    Swal.showValidationMessage("Necessário escolher ao menos uma opção!");
                    return;
                }

                setTheme(value);
                window.location.href = "/";
            }
        });
    }

    function handleLogout(): void {
        setAuth(null);
        navigate("/login");
    }

    return (
        <header>
            {menuActive &&
                <div className="block-touch"></div>
            }
            <div className="top-header">
                <button onClick={() => handleSetMenuStatus(true)}>
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h1>NuveLu | Minha Meta</h1>
            </div>
            <div className={`menu${menuActive ? " active" : ""}`}>
                <div className="menu-content">
                    <div className="user-info">
                        <div className="user-details">
                            <div className="user-cover">
                                <img src={user?.cover} alt="user-cover" />
                            </div>
                            <div className="user-name">
                                <h2>{user?.name}</h2>
                                <span>Metas 2025</span>
                            </div>
                        </div>
                        <div className="back-button">
                            <button onClick={() => handleSetMenuStatus(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>
                    <div className="menu-options">
                        <ul>
                            <li>
                                <button onClick={() => handleSetMenuStatus(false)}>
                                    <span className="material-symbols-outlined">home</span>
                                    Início
                                </button>
                            </li>
                            <li>
                                <button onClick={() => handleSetGoals()}>
                                    <span className="material-symbols-outlined">ads_click</span>
                                    Ajustar Meta
                                </button>
                            </li>
                            <li>
                                <button onClick={() => handleSetDailyValue()}>
                                    <span className="material-symbols-outlined">rocket_launch</span>
                                    Lançamento
                                </button>
                            </li>
                            <li>
                                <button onClick={() => handleNotificationPermission()}>
                                    <span className="material-symbols-outlined">notifications</span>
                                    Notificações
                                </button>
                            </li>
                            <li>
                                <button onClick={() => handleThemeColor()}>
                                    <span className="material-symbols-outlined">manufacturing</span>
                                    Configurações
                                </button>
                            </li>
                        </ul>
                    </div>
                    <div className="menu-logout">
                        <button onClick={() => handleLogout()}>
                            <span className="material-symbols-outlined">logout</span>
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}