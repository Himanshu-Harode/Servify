"use client";

import { useEffect, useState } from "react";
import { firestore, storage } from "@/context/Firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader, Edit, Trash, Plus, Image as ImageIcon } from "lucide-react"; // Icons
import { toast } from "@/hooks/use-toast"; // For toast notifications
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // For image display
import { motion } from "framer-motion"; // For animations
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"; // For the edit popup modal

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ name: "", image: null });
  const [editService, setEditService] = useState({ id: null, name: "", image: null });
  const [isEditing, setIsEditing] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for edit modal

  // Fetch Services from Firebase
  useEffect(() => {
    async function fetchServices() {
      try {
        const querySnapshot = await getDocs(collection(firestore, "service"));
        const servicesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setServices(servicesData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch services.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  // Upload Image to Firebase Storage
  const uploadImage = async (file) => {
    if (!file) return null;
    setImageUploading(true);
    try {
      const storageRef = ref(storage, `service/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image.",
        variant: "destructive",
      });
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  // Add Service to Firebase
  const addService = async () => {
    if (!newService.name || !newService.image) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const imageURL = await uploadImage(newService.image);
      if (!imageURL) return;

      const docRef = await addDoc(collection(firestore, "service"), {
        name: newService.name,
        image: imageURL,
      });
      setServices([...services, { id: docRef.id, name: newService.name, image: imageURL }]);
      setNewService({ name: "", image: null });
      toast({
        title: "Success",
        description: "Service added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add service.",
        variant: "destructive",
      });
    }
  };

  // Edit Service Handler
  const editServiceHandler = (service) => {
    setIsEditing(true);
    setEditService({ id: service.id, name: service.name, image: service.image });
    setIsEditModalOpen(true); // Open the edit modal
  };

  // Update Service in Firebase
  const updateService = async () => {
    if (!editService.name) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageURL = editService.image;
      if (editService.image instanceof File) {
        imageURL = await uploadImage(editService.image);
        if (!imageURL) return;
      }

      await updateDoc(doc(firestore, "service", editService.id), {
        name: editService.name,
        image: imageURL,
      });

      setServices(services.map((service) =>
        service.id === editService.id ? { ...service, name: editService.name, image: imageURL } : service
      ));
      setIsEditing(false);
      setEditService({ id: null, name: "", image: null });
      setIsEditModalOpen(false); // Close the edit modal
      toast({
        title: "Success",
        description: "Service updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service.",
        variant: "destructive",
      });
    }
  };

  // Delete Service from Firebase
  const removeService = async (id) => {
    try {
      await deleteDoc(doc(firestore, "services", id));
      setServices(services.filter((service) => service.id !== id));
      toast({
        title: "Success",
        description: "Service removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove service.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-center">Manage Services</h1>

      {/* Add Service Form */}
      <div className="bg-background p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Add New Service</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-2 flex-1">
            <Label>Name</Label>
            <Input
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              placeholder="Enter service name"
            />
          </div>
          <div className="space-y-2 flex-1">
            <Label>Image</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setNewService({ ...newService, image: file });
                  }
                }}
                className="cursor-pointer"
              />
              <ImageIcon className="text-muted-foreground" />
            </div>
          </div>
          <Button
            onClick={addService}
            className="self-end"
            disabled={imageUploading}
          >
            {imageUploading ? (
              <Loader className="animate-spin h-4 w-4" />
            ) : (
              "Add Service"
            )}
          </Button>
        </div>
      </div>

      {/* Services List */}
      {loading ? (
        <div className="flex justify-center">
          <Loader className="animate-spin h-8 w-8" />
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {services?.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <Avatar className="w-full h-48 rounded-t-lg">
                  <AvatarImage src={service?.image} alt={service?.name} className="object-cover" />
                  <AvatarFallback>{service?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </CardHeader>
              <CardContent className="p-4">
                <h2 className="text-xl font-bold">{service?.name}</h2>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 p-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editServiceHandler(service)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeService(service.id)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </CardFooter>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Edit Service Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editService.name}
                onChange={(e) => setEditService({ ...editService, name: e.target.value })}
                placeholder="Enter service name"
              />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setEditService({ ...editService, image: file });
                    }
                  }}
                  className="cursor-pointer"
                />
                <ImageIcon className="text-muted-foreground" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateService} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}