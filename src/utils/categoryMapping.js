import CalendarTask from "../../assets/icons/calendar_task.svg"
import Comment from "../../assets/icons/comment.svg"
import Done from "../../assets/icons/done.svg"
import Flag from "../../assets/icons/flag.svg"
import InProgress from "../../assets/icons/inprogress.svg"
import MatCamBuon from "../../assets/icons/matcambuon.svg"
import MatDoTucGian from "../../assets/icons/matdotucgian.svg"
import MatVangMiengNgang from "../../assets/icons/matvangmiengngang.svg"
import MatXanhCuoiLon from "../../assets/icons/matxanhcuoilon.svg"
import ToDo from "../../assets/icons/todo.svg"

export const CategoryMap = {
    'todo': ToDo,
    'in_progress': InProgress,
    'inprogress': InProgress,
    'done': Done,
    'comment': Comment,
    'calendar_task': CalendarTask,
    'flag': Flag,
    'mat_do_tuc_gian': MatDoTucGian,
    'mat_cam_buon': MatCamBuon,
    'mat_xanh_cuoi_lon': MatXanhCuoiLon,
    'mat_vang_mieng_ngang': MatVangMiengNgang,
}

export const DefaultCategory = ToDo;