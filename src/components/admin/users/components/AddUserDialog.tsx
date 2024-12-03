import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { AddUserForm } from "./AddUserForm";
import { useCreateUser } from "../hooks/useCreateUser";

export const AddUserDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { createUser, isLoading } = useCreateUser(() => setIsOpen(false));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <AddUserForm
          onSubmit={createUser}
          isLoading={isLoading}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};